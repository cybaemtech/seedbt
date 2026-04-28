import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="min-h-[80vh] w-full flex items-center justify-center"
    >
      <Card className="w-full max-w-md mx-4 border-border/60 shadow-xl rounded-2xl bg-card overflow-hidden text-center p-8">
        <div className="flex justify-center mb-6">
           <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
             <AlertCircle className="h-10 w-10 text-destructive" />
           </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">Page Not Found</h1>
        <p className="text-[15px] text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button className="w-full h-11 rounded-xl font-semibold shadow-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </motion.div>
  );
}
