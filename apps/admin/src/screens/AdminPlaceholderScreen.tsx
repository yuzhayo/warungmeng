export interface AdminPlaceholderScreenProps {
  readonly title: string;
  readonly description: string;
}

export function AdminPlaceholderScreen({ title, description }: AdminPlaceholderScreenProps) {
  return (
    <section aria-labelledby="placeholder-screen-title">
      <h1 id="placeholder-screen-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}
