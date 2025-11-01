import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List as ListIcon,
  Link2 as LinkIcon,
  Image as ImageIcon,
  Type as HeadingIcon,
} from "lucide-react";
import { useEffect } from "react";

export default function TiptapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      ListItem,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Text hier eingeben …" }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value);
  }, [editor, value]);

  if (!editor)
    return <div className="text-sm text-gray-500 p-4">Editor lädt …</div>;

  const iconBtn = (
    action: () => void,
    active: boolean,
    Icon: React.ElementType,
    label: string
  ) => (
    <Button
      type="button"
      size="icon"
      variant={active ? "default" : "outline"}
      onClick={action}
      title={label}
      className="h-8 w-8"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        {iconBtn(
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive("bold"),
          BoldIcon,
          "Fett"
        )}
        {iconBtn(
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive("italic"),
          ItalicIcon,
          "Kursiv"
        )}
        {iconBtn(
          () => editor.chain().focus().toggleUnderline().run(),
          editor.isActive("underline"),
          UnderlineIcon,
          "Unterstrichen"
        )}
        {iconBtn(
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive("heading", { level: 2 }),
          HeadingIcon,
          "Überschrift"
        )}
        {iconBtn(
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive("bulletList"),
          ListIcon,
          "Liste"
        )}
        {iconBtn(
          () => {
            const url = prompt("Link-URL:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          },
          editor.isActive("link"),
          LinkIcon,
          "Link"
        )}
        {iconBtn(
          () => {
            const url = prompt("Bild-URL oder Pfad:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          },
          false,
          ImageIcon,
          "Bild"
        )}
      </div>

      <EditorContent
        editor={editor}
        className="p-4 min-h-[220px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
}
