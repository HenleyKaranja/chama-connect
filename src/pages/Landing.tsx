import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users,
  PiggyBank,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Wallet,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import logoImg from "/logo.png";

const features = [
  {
    icon: Users,
    title: "Group Management",
    desc: "Create and manage Chamas with ease. Invite members, assign roles, and track activity.",
  },
  {
    icon: PiggyBank,
    title: "Contributions",
    desc: "Automate monthly contributions with M-Pesa integration and real-time tracking.",
  },
  {
    icon: Wallet,
    title: "Digital Wallet",
    desc: "Manage group funds transparently with a shared digital wallet and transaction history.",
  },
  {
    icon: TrendingUp,
    title: "Investments",
    desc: "Pool resources and invest in projects. Track returns and grow your wealth together.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Detailed financial reports, contribution trends, and investment performance dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    desc: "Admin, Treasurer, and Member roles with fine-grained permissions and audit trails.",
  },
];

const stats = [
  { value: "10K+", label: "Active Members" },
  { value: "500+", label: "Chama Groups" },
  { value: "KSh 50M+", label: "Funds Managed" },
  { value: "99.9%", label: "Uptime" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="M-Chama" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight text-foreground">M-Chama</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Kenya's #1 Chama Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Grow Together,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Save Smarter
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              M-Chama brings your savings group online. Track contributions, manage loans,
              invest together, and build wealth — all from one secure platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2 px-8 text-base">
                  Start Your Chama <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-2xl font-extrabold text-primary sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything Your Chama Needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            From contributions to investments — manage it all in one place.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(38_85%_55%/0.15),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl lg:text-4xl">
                Ready to Digitize Your Chama?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm text-primary-foreground/80 sm:text-base">
                Join thousands of groups already saving, investing, and growing together on M-Chama.
              </p>
              <div className="mt-8">
                <Link to="/auth?mode=signup">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 px-8 text-base font-semibold"
                  >
                    Create Free Account <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Landmark className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">M-Chama</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} M-Chama. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
