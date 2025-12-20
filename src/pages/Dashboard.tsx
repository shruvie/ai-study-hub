import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Users, 
  LogOut, 
  Search,
  Loader2,
  MoreVertical,
  Trash2,
  Share2,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShareModal } from '@/components/ShareModal';

interface Notebook {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  content_json: unknown;
  source_type?: string | null;
  source_content?: string | null;
  is_shared?: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sharedNotebooks, setSharedNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotebooks();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('notebooks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notebooks'
          },
          () => {
            fetchNotebooks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotebooks = async () => {
    if (!user) return;
    
    try {
      // Fetch owned notebooks
      const { data: owned, error: ownedError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch shared notebooks (via permissions)
      const { data: permissions, error: permError } = await supabase
        .from('notebook_permissions')
        .select('notebook_id')
        .eq('user_id', user.id);

      if (permError) throw permError;

      const sharedNotebookIds = permissions?.map(p => p.notebook_id) || [];
      
      let shared: Notebook[] = [];
      if (sharedNotebookIds.length > 0) {
        const { data: sharedData, error: sharedError } = await supabase
          .from('notebooks')
          .select('*')
          .in('id', sharedNotebookIds)
          .order('updated_at', { ascending: false });

        if (sharedError) throw sharedError;
        shared = (sharedData || []).map(n => ({ ...n, is_shared: true }));
      }

      // Check if owned notebooks have been shared with others
      const ownedWithShareStatus = await Promise.all(
        (owned || []).map(async (notebook) => {
          const { count } = await supabase
            .from('notebook_permissions')
            .select('*', { count: 'exact', head: true })
            .eq('notebook_id', notebook.id);
          
          return { ...notebook, is_shared: (count || 0) > 0 };
        })
      );

      setNotebooks(ownedWithShareStatus);
      setSharedNotebooks(shared);
    } catch (error) {
      console.error('Error fetching notebooks:', error);
      toast.error('Failed to load notebooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          owner_id: user.id,
          title: 'Untitled Notebook',
          content_json: {}
        })
        .select()
        .single();

      if (error) throw error;
      
      navigate(`/notebook/${data.id}`);
    } catch (error) {
      console.error('Error creating notebook:', error);
      toast.error('Failed to create notebook');
    }
  };

  const handleDeleteNotebook = async (notebookId: string) => {
    try {
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', notebookId);

      if (error) throw error;
      
      toast.success('Notebook deleted');
      fetchNotebooks();
    } catch (error) {
      console.error('Error deleting notebook:', error);
      toast.error('Failed to delete notebook');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const openShareModal = (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    setShareModalOpen(true);
  };

  const filteredNotebooks = notebooks.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedNotebooks = sharedNotebooks.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const NotebookCard = ({ notebook, isOwned = true }: { notebook: Notebook; isOwned?: boolean }) => (
    <Card 
      className="glass-card hover-lift cursor-pointer group"
      onClick={() => navigate(`/notebook/${notebook.id}`)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium line-clamp-1">
              {notebook.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {formatDate(notebook.updated_at)}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {notebook.is_shared && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Users className="h-3 w-3" />
              <span>Shared</span>
            </div>
          )}
          
          {isOwned && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/notebook/${notebook.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShareModal(notebook)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteNotebook(notebook.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notebook.source_type ? `Source: ${notebook.source_type}` : 'Click to add content'}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-tight flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">Study Sphere AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-tight py-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Your Notebooks</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your AI-powered study materials
            </p>
          </div>
          <Button onClick={handleCreateNotebook} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notebooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="my-notebooks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="my-notebooks">
                My Notebooks ({filteredNotebooks.length})
              </TabsTrigger>
              <TabsTrigger value="shared">
                Shared with Me ({filteredSharedNotebooks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-notebooks">
              {filteredNotebooks.length === 0 ? (
                <Card className="glass-card text-center py-12">
                  <CardContent>
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notebooks yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first notebook to get started
                    </p>
                    <Button onClick={handleCreateNotebook} className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Notebook
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotebooks.map((notebook) => (
                    <NotebookCard key={notebook.id} notebook={notebook} isOwned={true} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared">
              {filteredSharedNotebooks.length === 0 ? (
                <Card className="glass-card text-center py-12">
                  <CardContent>
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No shared notebooks</h3>
                    <p className="text-muted-foreground">
                      Notebooks shared with you will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSharedNotebooks.map((notebook) => (
                    <NotebookCard key={notebook.id} notebook={notebook} isOwned={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Share Modal */}
      {selectedNotebook && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          notebookId={selectedNotebook.id}
          notebookTitle={selectedNotebook.title}
          onShareComplete={fetchNotebooks}
        />
      )}
    </div>
  );
}
