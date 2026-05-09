import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import EmptyState from '../components/ux/EmptyState';
import Skeleton from '../components/ux/Skeleton';
import { useAuth } from '../features/auth/AuthContext';
import { discoverProfiles, fetchFollowers, fetchFollowing, fetchMyProfile, followProfile, unfollowProfile, updateMyProfile } from '../features/profile/profileApi';

const roleCopy = {
  ADMIN: {
    badge: 'Platform Admin',
    headline: 'Manage quality, creators, and platform trust.',
    accent: 'from-rose-500 to-orange-500',
  },
  CREATOR: {
    badge: 'Creator Profile',
    headline: 'Build courses, publish lessons, and grow your audience.',
    accent: 'from-violet-500 to-sky-500',
  },
  LEARNER: {
    badge: 'Learner Profile',
    headline: 'Track learning, revision, streaks, and community growth.',
    accent: 'from-emerald-500 to-teal-500',
  },
};

function initials(profile) {
  return (profile?.name || profile?.email || 'LD').slice(0, 2).toUpperCase();
}

function ProfileCard({ profile, currentUserId, onToggleFollow }) {
  const copy = roleCopy[profile.role] || roleCopy.LEARNER;
  const isMe = profile.id === currentUserId;
  return (
    <article className="ldw-glass-card p-4 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${copy.accent} font-black text-white shadow-lg`}>
          {initials(profile)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate font-black text-slate-950 dark:text-white">{profile.name || 'LearnDojo user'}</h3>
              <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">{profile.role}</p>
            </div>
            {!isMe ? (
              <button type="button" onClick={() => onToggleFollow(profile)} className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${profile.isFollowing ? 'border border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200' : 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'}`}>
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{profile.profile?.headline || copy.headline}</p>
          <div className="mt-3 flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{profile.followerCount} followers</span>
            <span>{profile.followingCount} following</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function RoleMetrics({ profile }) {
  const summary = profile?.roleSummary;
  if (!summary) return null;
  return (
    <section className="ldw-glass-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">{profile.role}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{summary.label}</h2>
        </div>
        <span className="rounded-2xl bg-white/70 px-4 py-3 text-2xl shadow-sm dark:bg-white/10">{profile.role === 'ADMIN' ? '🛡️' : profile.role === 'CREATOR' ? '🎬' : '🥋'}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {summary.metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileDashboard() {
  const { user, tokens } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ headline: '', bio: '', location: '', website: '', skills: '' });

  const copy = roleCopy[profile?.role || user?.role] || roleCopy.LEARNER;

  async function loadProfile() {
    const [me, discovered] = await Promise.all([
      fetchMyProfile(tokens.accessToken),
      discoverProfiles(tokens.accessToken),
    ]);
    setProfile(me);
    setProfiles(discovered);
    setForm({
      headline: me.profile?.headline || '',
      bio: me.profile?.bio || '',
      location: me.profile?.location || '',
      website: me.profile?.website || '',
      skills: (me.profile?.skills || []).join(', '),
    });
    const [followerRows, followingRows] = await Promise.all([
      fetchFollowers(tokens.accessToken, me.id),
      fetchFollowing(tokens.accessToken, me.id),
    ]);
    setFollowers(followerRows);
    setFollowing(followingRows);
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setIsLoading(true);
        await loadProfile();
        if (mounted) setError('');
      } catch (requestError) {
        if (mounted) setError(requestError?.userMessage || 'Unable to load profile');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [tokens.accessToken]);

  const visibleList = useMemo(() => {
    if (activeTab === 'followers') return followers;
    if (activeTab === 'following') return following;
    return profiles;
  }, [activeTab, followers, following, profiles]);

  async function handleSave(event) {
    event.preventDefault();
    try {
      setIsSaving(true);
      const updated = await updateMyProfile(tokens.accessToken, {
        ...form,
        skills: form.skills,
      });
      setProfile(updated);
      setError('');
    } catch (requestError) {
      setError(requestError?.userMessage || 'Unable to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleFollow(targetProfile) {
    try {
      if (targetProfile.isFollowing) {
        await unfollowProfile(tokens.accessToken, targetProfile.id);
      } else {
        await followProfile(tokens.accessToken, targetProfile.id);
      }
      await loadProfile();
    } catch (requestError) {
      setError(requestError?.userMessage || 'Unable to update follow status');
    }
  }

  return (
    <AppLayout title="Profile dashboard" eyebrow="Account">
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"><Skeleton className="h-96 rounded-[2rem]" /><Skeleton className="h-96 rounded-[2rem]" /></div>
      ) : null}

      {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-800 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-100">{error}</div> : null}

      {profile ? (
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <section className="ldw-glass-card overflow-hidden p-0">
            <div className={`h-32 bg-gradient-to-br ${copy.accent}`} />
            <div className="px-6 pb-6">
              <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-[2rem] border-4 border-white bg-slate-950 text-4xl font-black text-white shadow-2xl dark:border-slate-950">
                {initials(profile)}
              </div>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{copy.badge}</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{profile.name || 'LearnDojo User'}</h2>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-600 dark:text-slate-300">{profile.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"><p className="text-xl font-black text-slate-950 dark:text-white">{profile.followerCount}</p><p className="text-xs font-bold text-slate-500">Followers</p></div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"><p className="text-xl font-black text-slate-950 dark:text-white">{profile.followingCount}</p><p className="text-xs font-bold text-slate-500">Following</p></div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.profile?.bio || profile.profile?.headline || copy.headline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile.profile?.skills || []).length ? profile.profile.skills.map((skill) => <span key={skill} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">{skill}</span>) : <span className="text-sm font-semibold text-slate-500">Add skills to make your profile discoverable.</span>}
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <RoleMetrics profile={profile} />
            <form onSubmit={handleSave} className="ldw-glass-card p-6">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Edit public profile</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Headline" className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
                <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Skills: React, Node, Prisma" className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" className="min-h-28 rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white sm:col-span-2" />
              </div>
              <button type="submit" disabled={isSaving} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950">{isSaving ? 'Saving...' : 'Save profile'}</button>
            </form>
          </div>

          <section className="ldw-glass-card p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">Community</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Follow creators, admins, and learners from real users in your database.</p>
              </div>
              <div className="flex rounded-2xl border border-white/60 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
                {['discover', 'followers', 'following'].map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2 text-sm font-black capitalize ${activeTab === tab ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}>{tab}</button>)}
              </div>
            </div>
            {visibleList.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleList.map((item) => <ProfileCard key={item.id} profile={item} currentUserId={profile.id} onToggleFollow={handleToggleFollow} />)}</div> : <div className="mt-5"><EmptyState icon="👥" title={`No ${activeTab} yet`} description="When real users register or follow each other, they will appear here." /></div>}
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default ProfileDashboard;
