import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Plus } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  location: string;
  image_url?: string;
  is_available?: boolean;
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  resource_id: string;
  resources: Resource;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [resourceBookings, setResourceBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user's resources
      const { data: resources, error: resourcesError } = await supabase
        .from("resources")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (resourcesError) throw resourcesError;
      setMyResources(resources || []);

      // Fetch user's bookings (as renter)
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          resources (
            id,
            title,
            category,
            price,
            location,
            image_url
          )
        `)
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      setMyBookings(bookings || []);

      // Fetch bookings for user's resources (as owner)
      const { data: resourceBookingsData, error: resourceBookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          resources (
            id,
            title,
            category,
            price,
            location,
            image_url
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (resourceBookingsError) throw resourceBookingsError;
      setResourceBookings(resourceBookingsData || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      setMyResources(prev => prev.filter(r => r.id !== resourceId));
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;

      setResourceBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );

      toast({
        title: "Success",
        description: `Booking ${status} successfully`,
      });
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate("/add-resource")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resources">My Resources</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="requests">Booking Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myResources.map((resource) => (
              <Card key={resource.id}>
                {resource.image_url && (
                  <img
                    src={resource.image_url}
                    alt={resource.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <Badge variant={resource.is_available ? "default" : "secondary"}>
                      {resource.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  <p className="font-semibold mb-4">${resource.price}/day</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-resource/${resource.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="space-y-4">
            {myBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{booking.resources.title}</h3>
                      <p className="text-muted-foreground">
                        {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                      </p>
                      <p className="font-semibold">${booking.total_price}</p>
                    </div>
                    <Badge variant={
                      booking.status === "confirmed" ? "default" :
                      booking.status === "pending" ? "secondary" : "destructive"
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-4">
            {resourceBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{booking.resources.title}</h3>
                      <p className="text-muted-foreground">
                        {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                      </p>
                      <p className="font-semibold">${booking.total_price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        booking.status === "confirmed" ? "default" :
                        booking.status === "pending" ? "secondary" : "destructive"
                      }>
                        {booking.status}
                      </Badge>
                      {booking.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateBookingStatus(booking.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;