import { useState } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Label from "@/components/ui/Label";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";

export default function Home() {
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Component showcase</h1>
        <p className="mt-1 text-text-secondary">
          Temporary page to preview the design system. Will be replaced by the real homepage.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Form fields</h2>
        <div className="max-w-sm space-y-3">
          <div>
            <Label htmlFor="demo-input">Email</Label>
            <Input id="demo-input" placeholder="you@example.com" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="demo-textarea">Post content</Label>
            <Textarea id="demo-textarea" placeholder="Write something..." />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Avatars and badges</h2>
        <div className="flex items-center gap-4">
          <Avatar name="Gabriele Rossi" />
          <Avatar name="Jane Doe" src="https://i.pravatar.cc/100" />
          <Badge variant="accent">admin</Badge>
          <Badge variant="success">online</Badge>
          <Badge variant="danger">banned</Badge>
          <Badge>guest</Badge>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Alerts</h2>
        <div className="space-y-2">
          <Alert variant="info">This is an info message.</Alert>
          <Alert variant="success">Post saved successfully.</Alert>
          <Alert variant="danger">Login failed, check your credentials.</Alert>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Spinner</h2>
        <Spinner />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Pagination</h2>
        <Pagination page={page} totalPages={5} onPageChange={setPage} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Modal</h2>
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Delete post?">
          <p className="mb-4 text-sm text-text-secondary">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>Delete</Button>
          </div>
        </Modal>
      </Card>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
