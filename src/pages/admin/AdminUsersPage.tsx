import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, ShieldCheck, ShieldOff, BookOpen, User, Mail, Calendar, Phone, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [userPerms, setUserPerms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); loadSubjects(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').eq('is_active', true).order('name');
    setSubjects(data || []);
  };

  const toggleBan = async (u: any) => {
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    await supabase.from('users').update({ status: newStatus }).eq('id', u.id);
    toast.success(newStatus === 'banned' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    loadUsers();
  };

  const openPermissions = async (u: any) => {
    setSelectedUser(u);
    const { data } = await supabase.from('user_permissions').select('subject_id').eq('user_id', u.id);
    setUserPerms(data?.map((p: any) => p.subject_id) || []);
  };

  const togglePermission = async (subjectId: number) => {
    if (!selectedUser) return;
    if (userPerms.includes(subjectId)) {
      await supabase.from('user_permissions').delete().eq('user_id', selectedUser.id).eq('subject_id', subjectId);
      setUserPerms(prev => prev.filter(id => id !== subjectId));
      toast.success('Đã thu hồi quyền môn học');
    } else {
      await supabase.from('user_permissions').insert({
        user_id: selectedUser.id, subject_id: subjectId, granted_by: profile!.id
      });
      setUserPerms(prev => [...prev, subjectId]);
      toast.success('Đã cấp quyền môn học');
    }
  };

  const exportExcel = () => {
    const rows = [
      ['#', 'Username', 'Email', 'SĐT', 'Role', 'Status', 'Ngày đăng ký'].join(','),
      ...filtered.map((u, i) => [
        i + 1,
        u.username,
        u.email,
        u.phone || '',
        u.role,
        u.status,
        new Date(u.created_at).toLocaleDateString('vi'),
      ].join(','))
    ];
    const csv = '\ufeff' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toLocaleDateString('vi')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file danh sách người dùng');
  };

  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (search && !u.username?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase()) && !(u.phone || '').includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Người dùng</h1>
          <p className="text-sm text-muted-foreground">{users.length} tài khoản</p>
        </div>
        <Button variant="outline" onClick={exportExcel} className="gap-2">
          <Download className="h-4 w-4" /> Xuất Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo username, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả role</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="h-9 px-3 flex items-center">
          {filtered.length} kết quả
        </Badge>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-semibold">#</th>
                <th className="text-left p-3 font-semibold">Username</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">SĐT</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Ngày ĐK</th>
                <th className="text-center p-3 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr key={u.id} className={cn("border-t hover:bg-muted/20 transition-colors", u.status === 'banned' && "opacity-60")}>
                  <td className="p-3 text-muted-foreground">{idx + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0",
                        u.role === 'admin' ? "bg-gradient-to-br from-primary to-purple-600" : "bg-gradient-to-br from-muted-foreground to-muted-foreground/70"
                      )}>
                        {u.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{u.phone || '—'}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn("text-xs", u.role === 'admin' ? "text-primary border-primary/40" : "")}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={cn("text-xs border", u.status === 'active'
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300"
                    )}>
                      {u.status === 'active' ? 'Active' : 'Banned'}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString('vi')}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7"
                        onClick={() => openPermissions(u)} disabled={u.role === 'admin'}>
                        <BookOpen className="h-3 w-3" /> Quyền
                      </Button>
                      <Button size="sm" variant={u.status === 'banned' ? 'outline' : 'ghost'}
                        className={cn("gap-1 text-xs h-7", u.status === 'active' ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-600 hover:bg-green-50")}
                        onClick={() => toggleBan(u)} disabled={u.id === profile?.id}>
                        {u.status === 'banned'
                          ? <><ShieldCheck className="h-3 w-3" /> Unban</>
                          : <><ShieldOff className="h-3 w-3" /> Ban</>
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
            </div>
          )}
        </div>
      )}

      {/* Permissions dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold">Phân quyền môn học</div>
                <div className="text-sm text-muted-foreground font-normal">{selectedUser?.username}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Chưa có môn học nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                {subjects.map(s => (
                  <label key={s.id}
                    className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 group">
                    <div className="pt-1">
                      <Checkbox
                        checked={userPerms.includes(s.id)}
                        onCheckedChange={() => togglePermission(s.id)}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.name}</p>
                        {userPerms.includes(s.id) && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-300 hover:bg-green-200">
                            ✓ Đã cấp
                          </Badge>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{s.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={() => setSelectedUser(null)} 
              className="flex-1"
              variant="outline"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}