import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function AdminPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { user } = useAuth();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statuses, setStatuses] = useState({});
  const usersRef = useRef([]);

  function fetchStatuses(userList) {
    return Promise.all(
      userList.map((u) =>
        api.get(endpoints.users.statusById(u.id))
          .then((r) => ({ id: u.id, ...r.data }))
          .catch(() => ({ id: u.id, onlineStatus: "OFFLINE", blocked: false }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ id, onlineStatus, blocked }) => {
        map[id] = { onlineStatus, blocked };
      });
      setStatuses(map);
    });
  }

  // Load user list once, then poll statuses every 15 seconds
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.get(endpoints.users.all)
      .then((res) => {
        const list = res.data || [];
        if (!cancelled) { setUsers(list); usersRef.current = list; }
        return fetchStatuses(list);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    const interval = setInterval(() => {
      if (usersRef.current.length > 0) fetchStatuses(usersRef.current);
    }, 15000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  async function toggleBlock(userId, currentlyBlocked) {
    try {
      if (currentlyBlocked) {
        await api.put(endpoints.users.unblock(userId));
      } else {
        await api.put(endpoints.users.block(userId));
      }
      setStatuses((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], blocked: !currentlyBlocked },
      }));
    } catch (err) {
      console.error("Block toggle failed", err);
    }
  }

  async function changeRole(userId, currentRole) {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await api.put(endpoints.users.changeRole(userId, newRole));
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data.role } : u))
      );
    } catch (err) {
      console.error("Role change failed", err);
    }
  }

  if (!user || user.role !== "ADMIN") {
    return <p className="text-text-secondary">Access denied. Admins only.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("admin:title")}</h1>
      <p className="text-text-secondary">{t("admin:subtitle")}</p>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {users.map((u) => {
              const status = statuses[u.id] || {};
              const isBlocked = status.blocked;
              const isOnline  = status.onlineStatus === "ONLINE";
              const isCurrentUser = u.id === user.id;
              return (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={u.nickname} size={36} />
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg ${isOnline ? "bg-success" : "bg-text-tertiary"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.nickname}</p>
                    </div>
                    {u.role === "ADMIN" && <Badge variant="accent">{t("common:status.admin")}</Badge>}
                    {isBlocked && <Badge variant="danger">{t("common:status.blocked")}</Badge>}
                  </div>

                  {!isCurrentUser && (
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => changeRole(u.id, u.role)}>
                        {u.role === "ADMIN" ? t("admin:demote") : t("admin:makeAdmin")}
                      </Button>
                      <Button variant="secondary" onClick={() => toggleBlock(u.id, isBlocked)}>
                        {isBlocked ? t("admin:unblock") : t("admin:block")}
                      </Button>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "admin"])),
    },
  };
}
