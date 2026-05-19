import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Workspace = {
  id: string;
  name: string;
  type: "startup" | "enterprise" | "personal";
  created_by: string;
  created_at: string;
};

type Ctx = {
  workspaces: Workspace[];
  current: Workspace | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCurrent: (id: string) => void;
  createWorkspace: (name: string, type: Workspace["type"]) => Promise<Workspace>;
};

const WCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "veto.currentWorkspaceId";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setWorkspaces(data as Workspace[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!workspaces.length) return;
    if (!currentId || !workspaces.find((w) => w.id === currentId)) {
      setCurrentId(workspaces[0].id);
    }
  }, [workspaces, currentId]);

  useEffect(() => {
    if (currentId) localStorage.setItem(STORAGE_KEY, currentId);
  }, [currentId]);

  const value = useMemo<Ctx>(
    () => ({
      workspaces,
      current: workspaces.find((w) => w.id === currentId) ?? null,
      loading,
      refresh,
      setCurrent: setCurrentId,
      createWorkspace: async (name, type) => {
        if (!user) throw new Error("Not signed in");
        const { data, error } = await supabase
          .from("workspaces")
          .insert({ name, type, created_by: user.id })
          .select()
          .single();
        if (error) throw error;
        await refresh();
        setCurrentId(data.id);
        return data as Workspace;
      },
    }),
    [workspaces, currentId, loading, refresh, user],
  );

  return <WCtx.Provider value={value}>{children}</WCtx.Provider>;
}

export function useWorkspace() {
  const v = useContext(WCtx);
  if (!v) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return v;
}
