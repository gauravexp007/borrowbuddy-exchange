import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, DollarSign } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  image_url?: string;
  availability_start: string;
  availability_end: string;
  owner_id: string;
}

const BookResource = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchResource();
  }, [id, user, navigate]);

  const fetchResource = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("id", id)
        .eq("is_available", true)
        .single();

      if (error) throw error;
      setResource(data);
    } catch (error) {
      console.error("Error fetching resource:", error);
      toast({
        title: "Error",
        description: "Resource not found or unavailable",
        variant: "destructive",
      });
      navigate("/resources");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!startDate || !endDate || !resource) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, days) * resource.price;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resource) return;

    if (resource.owner_id === user.id) {
      toast({
        title: "Error",
        description: "You cannot book your own resource",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    try {
      const totalPrice = calculateTotalPrice();
      
      const { error } = await supabase
        .from("bookings")
        .insert({
          resource_id: resource.id,
          renter_id: user.id,
          owner_id: resource.owner_id,
          start_time: startDate,
          end_time: endDate,
          payment_method: paymentMethod,
          total_price: totalPrice,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Booking request submitted successfully",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading resource...</div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Resource not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resource Details */}
        <div>
          {resource.image_url && (
            <img
              src={resource.image_url}
              alt={resource.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{resource.title}</h1>
              <Badge variant="secondary">{resource.category}</Badge>
            </div>
            
            <p className="text-muted-foreground">{resource.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{resource.location}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-lg font-semibold">${resource.price}/day</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>
                  Available: {new Date(resource.availability_start).toLocaleDateString()} - {new Date(resource.availability_end).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book This Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={resource.availability_start}
                  max={resource.availability_end}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || resource.availability_start}
                  max={resource.availability_end}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <select
                  id="payment_method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {startDate && endDate && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Total Price:</span>
                    <span className="text-lg font-bold">${calculateTotalPrice()}</span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={booking}>
                {booking ? "Booking..." : "Submit Booking Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookResource;