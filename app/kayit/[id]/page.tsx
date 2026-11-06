import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getEvent, getRegistrations } from "@/lib/data";
import RegistrationForm from "./RegistrationForm";

// Liste her açılışta güncel olsun.
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = UUID.test(id) ? await getEvent(id) : null;
  if (!event) return { title: "Turnuva kaydı" };
  return {
    title: `${event.title}: Kayıt`,
    description: `${event.title} için çift olarak kayıt olun ve kayıtlı çiftleri görün. Kartal Briç Spor Kulübü.`,
    alternates: { canonical: `/kayit/${event.id}` },
  };
}

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const event = await getEvent(id);
  if (!event) notFound();

  const regs = await getRegistrations(id);

  return (
    <>
      <header className="nav">
        <a href="/" className="brand">
          <img src="/logo.jpg" alt="Kartal Briç Spor Kulübü logosu" />
          <span>Kartal Briç</span>
        </a>
        <nav className="nav-links">
          <a href="/">Ana sayfa</a>
        </nav>
      </header>

      <main className="reg-wrap">
        <h1>{event.title}</h1>
        <p className="reg-sub">
          {event.event_date ? `${formatDate(event.event_date)} · ` : ""}
          {regs.length} çift kayıtlı
        </p>

        {event.is_open ? (
          <RegistrationForm eventId={event.id} />
        ) : (
          <div className="form-card">
            <h2>Kayıtlar kapandı</h2>
            <p className="empty">Bu turnuva için yeni kayıt alınmıyor.</p>
          </div>
        )}

        <section id="liste">
          <h2 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 800 }}>Kayıt olanlar</h2>
          {regs.length === 0 ? (
            <p className="empty">Henüz kayıt yok.</p>
          ) : (
            <ol className="pair-list">
              {regs.map((r) => (
                <li key={r.id}>
                  {r.p1_name} / {r.p2_name}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </>
  );
}
