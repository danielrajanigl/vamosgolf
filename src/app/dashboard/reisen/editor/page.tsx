"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import TiptapEditor from "@/components/Editor/TiptapEditor";

const schema = z.object({
  title_de: z.string().min(3),
  title_en: z.string().optional(),
  title_es: z.string().optional(),
  base_price_cents: z.number().min(1),
  status: z.enum(["draft", "published"]),
});

type FormData = z.infer<typeof schema>;

export default function ReiseEditor() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const sb = supabaseBrowser();
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  async function onSubmit(data: FormData) {
    try {
      let imageUrl: string | null = null;
      if (image) {
        const { data: upload, error } = await sb.storage
          .from("reisen_images")
          .upload(`${Date.now()}_${image.name}`, image);
        if (error) throw error;
        const { data: urlData } = sb.storage
          .from("reisen_images")
          .getPublicUrl(upload.path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await sb.from("vamosgolf_trips").insert({
        slug: data.title_de.toLowerCase().replace(/ /g, "-"),
        title: { de: data.title_de, en: data.title_en, es: data.title_es },
        base_price_cents: data.base_price_cents,
        image_url: imageUrl,
        description: { de: description },
        status: status,
      });
      if (error) throw error;
      reset();
      router.push("/dashboard/reisen");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        <Card className="p-6 space-y-4 shadow-sm border bg-white">
          <Label>Titel (Deutsch)</Label>
          <Input {...register("title_de")} placeholder="Golfreise Andalusien" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Englisch</Label>
              <Input
                {...register("title_en")}
                placeholder="Golf trip Andalusia"
              />
            </div>
            <div>
              <Label>Spanisch</Label>
              <Input
                {...register("title_es")}
                placeholder="Viaje de golf Andalucía"
              />
            </div>
          </div>

          <div>
            <Label>Beschreibung</Label>
            <TiptapEditor value={description} onChange={setDescription} />
          </div>
        </Card>

        <Card className="p-6 shadow-sm border bg-white">
          <Label>Bild (Titelbild)</Label>
          <Input
            type="file"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5 shadow-sm border bg-white">
          <h2 className="text-lg font-semibold mb-3">Veröffentlichung</h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Status:</span>
            <select
              {...register("status")}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
              className="border rounded-md text-sm px-2 py-1"
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Speichern…" : "Veröffentlichen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/reisen")}
            >
              Abbrechen
            </Button>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border bg-white">
          <h2 className="text-lg font-semibold mb-3">Preis</h2>
          <Input
            type="number"
            {...register("base_price_cents", { valueAsNumber: true })}
            placeholder="1299"
          />
        </Card>
      </div>
    </div>
  );
}
