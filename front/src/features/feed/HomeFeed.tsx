import { FeedCardSkeleton } from "@/components/feed/FeedCardSkeleton";

const tags = ["미니멀", "출근룩", "데님", "레이어드"];

export function HomeFeed() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6">
        <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
          오늘의 코디 피드
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          보유한 옷을 바탕으로 코디 요청을 올리고, 다른 사용자의 스타일링을 탐색합니다.
        </p>
      </section>
      <section aria-label="추천 태그" className="mb-6 flex gap-2 overflow-x-auto">
        {tags.map((tag) => (
          <span
            key={tag}
            className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            #{tag}
          </span>
        ))}
      </section>
      <section
        aria-label="피드 로딩 상태"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <FeedCardSkeleton key={index} />
        ))}
      </section>
    </main>
  );
}
