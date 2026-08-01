import { TextAnimate } from "@/registry/marketing/text-animate";
export default function TextAnimateDemo() {
  return (
    <h2 className="text-3xl font-semibold tracking-tight">
      <TextAnimate animation="blurInUp" by="word" startOnView={false}>
        Make your launch feel launched.
      </TextAnimate>
    </h2>
  );
}
