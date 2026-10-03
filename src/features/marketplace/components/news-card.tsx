export type NewsCardProps = {
  title: string;
  date: string;
  description: string;
  imageSrc: string;
};

export default function NewsCard({
  title,
  date,
  description,
  imageSrc,
}: NewsCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <img src={imageSrc} alt={title} className="h-44 w-full object-cover" />
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">{date}</p>
        <h3 className="mt-1 text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </article>
  );
}
