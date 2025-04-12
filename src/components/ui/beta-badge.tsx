"use client";

import { Badge } from "@/components/ui/badge";

export function BetaBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="secondary" className="bg-green-500 hover:bg-green-600 text-white">
        Beta v0.1.0
      </Badge>
    </div>
  );
} 