import { HeroVideoDialog } from "@/components/marketing/hero-video-dialog";

const thumbnail = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#e7e5e4"/><rect x="80" y="80" width="1120" height="560" rx="24" fill="#d6d3d1"/><text x="640" y="380" font-family="sans-serif" font-size="48" fill="#78716c" text-anchor="middle">Product tour</text></svg>`,
)}`;

export default function HeroVideoDialogDemo() {
  return (
    <div className="w-full max-w-xl">
      <HeroVideoDialog
        videoSrc="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
        thumbnailSrc={thumbnail}
        thumbnailAlt="Product tour"
      />
    </div>
  );
}
