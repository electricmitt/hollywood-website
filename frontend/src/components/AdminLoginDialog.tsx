import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** From useAdminSession; resolves true on a successful login. */
  login: (password: string) => Promise<boolean>;
}

/** Shared admin login dialog used by the calendar and events pages. */
export function AdminLoginDialog({ open, onOpenChange, login }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setPassword(""); setError(""); setLoading(false); };

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (await login(password)) {
        reset();
        onOpenChange(false);
        toast.success("Admin mode enabled");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Admin Login
          </DialogTitle>
          <DialogDescription>
            Enter the admin password to unlock event management controls.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleLogin} disabled={loading || !password.trim()}>
            {loading ? "Verifying..." : "Login"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
