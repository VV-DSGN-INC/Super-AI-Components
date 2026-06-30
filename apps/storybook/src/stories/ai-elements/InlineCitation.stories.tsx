import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationQuote,
  InlineCitationSource,
  InlineCitationText,
} from "@/components/ai-elements/inline-citation";

const meta: Meta<typeof InlineCitation> = {
  title: "AI Elements/Inline Citation",
  component: InlineCitation,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof InlineCitation>;

const sources = [
  "https://buffer.com/library/short-form-video",
  "https://later.com/blog/video-retention",
];

export const Default: Story = {
  render: () => (
    <p className="max-w-prose text-sm leading-relaxed">
      The first three seconds of a short-form video drive most of the retention,
      so the hook should land before any branding.{" "}
      <InlineCitation>
        <InlineCitationText>Hooks under 3 seconds retain best</InlineCitationText>
        <InlineCitationCard>
          <InlineCitationCardTrigger sources={sources} />
          <InlineCitationCardBody>
            <InlineCitationCarousel>
              <InlineCitationCarouselHeader>
                <InlineCitationCarouselPrev />
                <InlineCitationCarouselIndex />
                <InlineCitationCarouselNext />
              </InlineCitationCarouselHeader>
              <InlineCitationCarouselContent>
                <InlineCitationCarouselItem>
                  <InlineCitationSource
                    description="Analysis of 10k short-form ads showing retention drop-off after 3 seconds without a hook."
                    title="The Anatomy of a Short-Form Hook"
                    url={sources[0]}
                  />
                  <InlineCitationQuote>
                    Videos that open with a visual hook in the first 3 seconds saw
                    2.4x higher completion rates.
                  </InlineCitationQuote>
                </InlineCitationCarouselItem>
                <InlineCitationCarouselItem>
                  <InlineCitationSource
                    description="Benchmarks on how watch-time correlates with placing branding after the hook."
                    title="Video Retention Benchmarks 2026"
                    url={sources[1]}
                  />
                </InlineCitationCarouselItem>
              </InlineCitationCarouselContent>
            </InlineCitationCarousel>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    </p>
  ),
};
