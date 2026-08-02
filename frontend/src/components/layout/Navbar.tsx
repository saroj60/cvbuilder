import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { LogOut, User, Sparkles, Download } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isInstallable, installApp } = usePWA();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <span>Resume builder</span>
        </div>

        <div className="flex items-center gap-4">
          {isInstallable && (
            <Button
              onClick={installApp}
              className="bg-gradient-to-r from-primary/90 to-indigo-600/90 hover:from-primary hover:to-indigo-600 text-white gap-2 font-medium shadow-sm hover:shadow transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Install App</span>
            </Button>
          )}
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:block text-xs text-left">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Logout"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
