"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

const MOCK_COMMUNITIES = [
  {
    id: "1",
    name: "Landscape Photography",
    members: 1234,
    description: "A community for landscape photography enthusiasts"
  },
  {
    id: "2",
    name: "Portrait Masters",
    members: 856,
    description: "Share and discuss portrait photography techniques"
  },
  {
    id: "3",
    name: "Street Photography",
    members: 2341,
    description: "Capturing life in the streets around the world"
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export default function CommunityPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <motion.h1 
          className="text-3xl font-bold mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          <Users className="h-8 w-8" />
          Community
        </motion.h1>
        <motion.div 
          className="grid gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {MOCK_COMMUNITIES.map((community) => (
            <motion.div
              key={community.id}
              variants={item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {community.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">
                    {community.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {community.members.toLocaleString()} members
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}