import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/useWallet';
import { Coins, Gavel, Menu, User, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import logo from '@/assets/logo.png';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { data: wallet } = useWallet();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Lelang', icon: Gavel },
    ...(user ? [{ href: '/wallet', label: 'Dompet', icon: Coins }] : []),
    ...(user ? [{ href: '/transactions', label: 'Transaksi', icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Lelang-GO logo by Gibikey Studio" className="h-10 w-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-bold text-foreground">Lelang-GO</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">by Gibikey Studio</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant={location.pathname === link.href ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user && wallet && (
            <Link to="/wallet">
              <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
                <Coins className="h-4 w-4" />
                <span>{wallet.balance.toLocaleString()}</span>
                {wallet.hold_balance > 0 && (
                  <span className="text-muted-foreground">({wallet.hold_balance} hold)</span>
                )}
              </div>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">{profile?.display_name || user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gradient-primary text-primary-foreground">Masuk</Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}>
                    <Button variant={location.pathname === link.href ? 'secondary' : 'ghost'} className="w-full justify-start gap-2">
                      <link.icon className="h-4 w-4" /> {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
