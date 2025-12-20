import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Mail, Trash2, Users } from 'lucide-react';
import { z } from 'zod';

interface SharedUser {
  id: string;
  user_id: string;
  role: 'viewer' | 'editor';
  email?: string;
}

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  notebookTitle: string;
  onShareComplete: () => void;
}

const emailSchema = z.string().email('Please enter a valid email address');

export function ShareModal({ open, onOpenChange, notebookId, notebookTitle, onShareComplete }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSharedUsers();
    }
  }, [open, notebookId]);

  const fetchSharedUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: permissions, error } = await supabase
        .from('notebook_permissions')
        .select('id, user_id, role')
        .eq('notebook_id', notebookId);

      if (error) throw error;

      // Get profile emails for shared users
      const usersWithEmails = await Promise.all(
        (permissions || []).map(async (perm) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', perm.user_id)
            .single();
          
          return {
            ...perm,
            email: profile?.email || "${email}"
          };
        })
      );

      setSharedUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching shared users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleShare = async () => {
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      // Use the secure RPC function to look up user by email
      const { data: userId, error: lookupError } = await supabase
        .rpc('lookup_user_id_by_email', { lookup_email: email.toLowerCase() });

      if (lookupError) throw lookupError;

      if (!userId) {
        toast.error('No user found with that email address');
        setLoading(false);
        return;
      }

      // Check if already shared
      const { data: existing } = await supabase
        .from('notebook_permissions')
        .select('id')
        .eq('notebook_id', notebookId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update role
        const { error: updateError } = await supabase
          .from('notebook_permissions')
          .update({ role })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        toast.success('Permission updated');
      } else {
        // Create new permission
        const { error: insertError } = await supabase
          .from('notebook_permissions')
          .insert({
            notebook_id: notebookId,
            user_id: userId,
            role
          });

        if (insertError) throw insertError;
        toast.success(`Notebook shared with ${email}`);
      }

      setEmail('');
      fetchSharedUsers();
      onShareComplete();
    } catch (error) {
      console.error('Error sharing notebook:', error);
      toast.error('Failed to share notebook');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccess = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('notebook_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;
      
      toast.success('Access removed');
      fetchSharedUsers();
      onShareComplete();
    } catch (error) {
      console.error('Error removing access:', error);
      toast.error('Failed to remove access');
    }
  };

  const handleUpdateRole = async (permissionId: string, newRole: 'viewer' | 'editor') => {
    try {
      const { error } = await supabase
        .from('notebook_permissions')
        .update({ role: newRole })
        .eq('id', permissionId);

      if (error) throw error;
      
      toast.success('Role updated');
      fetchSharedUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{notebookTitle}"
          </DialogTitle>
          <DialogDescription>
            Invite others to view or edit this notebook
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new user */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="share-email" className="sr-only">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="share-email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'editor')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleShare} disabled={loading || !email} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Share
          </Button>

          {/* Shared users list */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-3">People with access</h4>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sharedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                This notebook hasn't been shared yet
              </p>
            ) : (
              <ul className="space-y-2">
                {sharedUsers.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                    <span className="text-sm truncate flex-1">{user.email}</span>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={user.role} 
                        onValueChange={(v) => handleUpdateRole(user.id, v as 'viewer' | 'editor')}
                      >
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAccess(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
