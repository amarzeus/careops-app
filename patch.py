import os

file_path = "src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "            <div className=\"grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-6\">"
end_marker = "            </div>\n          </div>\n        </section>\n\n        {/* ─── INTEGRATIONS ─── */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_content = """            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-6 lg:auto-rows-fr">
              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-4 md:row-span-2 md:p-6 lg:p-8">
                <div className="relative z-10">
                  <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-colors group-hover:bg-blue-500/20">
                    <Calendar className="text-blue-500 h-6 w-6" />
                  </motion.div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight md:text-2xl">Smart Bookings</h3>
                  <p className="text-foreground/80 max-w-xl text-sm leading-relaxed font-medium md:text-base">
                    Public scheduling pages with live availability, automated reminders, and conflict-free
                    calendar sync across your entire team.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["24/7 self-scheduling", "No-show recovery", "Multi-location routing"].map((chip) => (
                      <span key={chip} className="bg-background/80 border-border/60 text-foreground/85 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Decorative animations */}
                <motion.div
                  className="pointer-events-none absolute right-6 bottom-6 z-10 hidden items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 backdrop-blur-md md:flex"
                  animate={{ y: [0, -8, 0], rotate: [0, 2, -1, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-foreground/80 text-xs font-semibold uppercase tracking-wider">No-shows</span>
                  <span className="text-foreground text-base font-black">-35%</span>
                </motion.div>
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-blue-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:p-6 lg:p-7">
                <div className="relative z-10">
                  <motion.div whileHover={{ scale: 1.05, rotate: -5 }} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 transition-colors group-hover:bg-pink-500/20">
                    <MessageSquare className="text-pink-500 h-6 w-6" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">Unified Inbox</h3>
                  <ul className="text-foreground/80 space-y-2 text-sm leading-relaxed font-medium">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-pink-500/50" />SMS, email, & chat timelines</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-pink-500/50" />AI suggested 1-click replies</li>
                  </ul>
                </div>
                <motion.div
                  className="pointer-events-none absolute top-5 right-5 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs font-bold text-foreground shadow-lg backdrop-blur-md"
                  animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  12 unread
                </motion.div>
                <div className="absolute right-0 bottom-0 -z-10 h-2/3 w-2/3 bg-gradient-to-tl from-pink-500/15 to-transparent opacity-50 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:p-6 lg:p-7">
                <div className="relative z-10">
                  <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                    <FileText className="h-6 w-6 text-purple-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">Dynamic Forms</h3>
                  <ul className="text-foreground/80 space-y-2 text-sm leading-relaxed font-medium">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-purple-500/50" />Fields adapt to user input</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-purple-500/50" />Validated CRM handoffs</li>
                  </ul>
                </div>
                <motion.div
                  className="pointer-events-none absolute right-5 bottom-6 h-1.5 w-24 overflow-hidden rounded-full bg-purple-500/20"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                >
                  <motion.div
                    className="h-full rounded-full bg-purple-500/80"
                    animate={{ x: [-30, 90] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                    style={{ width: 30 }}
                  />
                </motion.div>
                <div className="absolute right-0 bottom-0 -z-10 h-2/3 w-2/3 bg-gradient-to-tl from-purple-500/15 to-transparent opacity-50 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:row-span-2 xl:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">Live Analytics</h3>
                  <p className="text-foreground/80 mb-6 text-sm flex-1 font-medium leading-[1.6]">
                    Real-time metrics, predictive forecasting, and custom KPI tracking to optimize operational flow. Monitor staff utilization and revenue leaks instantly.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    {[
                      { label: "Revenue", value: "+18%", trend: "up" },
                      { label: "Dropoff", value: "-7%", trend: "down" },
                      { label: "Bookings", value: "+11%", trend: "up" },
                      { label: "Retention", value: "94%", trend: "up" },
                    ].map((m, i) => (
                      <motion.div
                        key={m.label}
                        className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background/80 p-2.5 shadow-sm transition-colors group-hover:border-emerald-500/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="text-foreground/70 mb-1 text-xs font-semibold uppercase tracking-wider">{m.label}</div>
                        <div className={`text-base font-black sm:text-lg ${m.trend === 'up' ? 'text-emerald-500' : 'text-foreground'}`}>{m.value}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-emerald-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:row-span-2 xl:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <motion.div whileHover={{ scale: 1.05, rotate: -5 }} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 transition-colors group-hover:bg-cyan-500/20">
                    <ShieldCheck className="h-6 w-6 text-cyan-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">Compliance Guardrails</h3>
                  <p className="text-foreground/80 mb-6 text-sm flex-1 font-medium leading-[1.6]">
                    HIPAA & SOC2 ready infrastructure. Implement strict role-based access controls, comprehensive activity logging, and automatic data retention policies for complete peace of mind.
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      { text: "Role-based matrix", icon: Users },
                      { text: "Detailed audit trail", icon: Search },
                      { text: "Auto data retention", icon: CheckCheck },
                    ].map((item, i) => (
                      <motion.div
                        key={item.text}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.4 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 transition-colors group-hover:border-cyan-500/30"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                           <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-cyan-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:row-span-2 xl:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
                    <Zap className="h-6 w-6 text-amber-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">Automation Engine</h3>
                  <p className="text-foreground/80 mb-6 text-sm flex-1 font-medium leading-[1.6]">
                    Visually map out complex sequences using our drag-and-drop workflow builder. Build timed and event-based flows for reminders, escalations, and automated follow-ups.
                  </p>
                  <div className="relative mt-auto">
                    <div className="flex flex-col gap-2">
                       <motion.div 
                         className="h-2 w-full rounded-full bg-amber-500/10 overflow-hidden"
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         viewport={{ once: true }}
                       >
                         <motion.div className="h-full bg-amber-500" animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
                       </motion.div>
                       <motion.div 
                         className="h-2 w-4/5 rounded-full bg-amber-500/10 overflow-hidden"
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         viewport={{ once: true }}
                       >
                         <motion.div className="h-full bg-amber-400" animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.2 }} />
                       </motion.div>
                       <motion.div 
                         className="h-2 w-3/5 rounded-full bg-amber-500/10 overflow-hidden"
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         viewport={{ once: true }}
                       >
                         <motion.div className="h-full bg-amber-300" animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.4 }} />
                       </motion.div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-amber-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>
"""

final_content = content[:start_idx] + new_content + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)
print("Updated successfully")
