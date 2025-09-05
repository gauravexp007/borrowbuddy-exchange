import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Share2, Shield, Users } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  image_url?: string;
}

const Index = () => {
  const { user } = useAuth();
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);

  useEffect(() => {
    fetchFeaturedResources();
  }, []);

  const fetchFeaturedResources = async () => {
    try {
      const { data } = await supabase
        .from("resources")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      setFeaturedResources(data || []);
    } catch (error) {
      console.error("Error fetching featured resources:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Share Resources, Build Community
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with your neighbors to share tools, equipment, and resources. 
            Save money, reduce waste, and strengthen your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/resources">
              <Button size="lg" className="w-full sm:w-auto">
                Browse Resources
              </Button>
            </Link>
            {user ? (
              <Link to="/add-resource">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Share a Resource
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Resources</h3>
              <p className="text-muted-foreground">
                Browse available tools, equipment, and resources in your area.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Earn</h3>
              <p className="text-muted-foreground">
                List your unused items and earn money while helping others.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Community</h3>
              <p className="text-muted-foreground">
                Connect with neighbors and strengthen your local community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Featured Resources</h2>
              <Link to="/resources">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden">
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
                      <Badge variant="secondary">{resource.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">${resource.price}/day</span>
                      <Link to={`/book/${resource.id}`}>
                        <Button size="sm">Book Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community and start sharing resources today.
          </p>
          {!user && (
            <Link to="/auth">
              <Button size="lg">Sign Up Now</Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
