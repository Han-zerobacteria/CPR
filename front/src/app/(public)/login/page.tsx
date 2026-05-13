export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <section className="rounded-md border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-950">로그인</h1>
        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">아이디</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-950"
              name="username"
              type="text"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">비밀번호</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-950"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <button
            className="h-11 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white"
            type="button"
          >
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
