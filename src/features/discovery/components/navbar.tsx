"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { KudosLogo } from "@/shared/components/kudos";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={cn(
        "fixed top-4 left-4 right-4 z-50",
        "bg-card/80 backdrop-blur-md",
        "border border-border/50 rounded-xl",
        "h-16 px-4",
        "flex items-center justify-between",
        "shadow-md",
        className,
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <KudosLogo size={36} variant="full" />
      </Link>

      {/* Desktop Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courts..."
            className="pl-10 h-10 rounded-lg"
          />
        </div>
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/owner/onboarding">List Your Court</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Link>
        </Button>
      </div>

      {/* Mobile Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col gap-4 mt-8">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courts..."
                className="pl-10"
              />
            </div>

            <hr className="my-2" />

            {/* Mobile Navigation Links */}
            <Link
              href="/"
              className="py-2 text-lg font-medium"
              onClick={() => setIsOpen(false)}
            >
              Discover Courts
            </Link>
            <Link
              href="/courts"
              className="py-2 text-lg font-medium"
              onClick={() => setIsOpen(false)}
            >
              Browse All Courts
            </Link>

            <hr className="my-2" />

            <Link
              href="/owner/onboarding"
              className="py-2 text-lg font-medium text-accent"
              onClick={() => setIsOpen(false)}
            >
              List Your Court
            </Link>

            <hr className="my-2" />

            <Button asChild className="w-full">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/register" onClick={() => setIsOpen(false)}>
                Create Account
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
