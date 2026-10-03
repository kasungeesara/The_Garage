export type VehicleCardProps = {
  vehicleName: string;
  km: number | string;
  transmission: string;
  imageSrc?: string;
  Price?: string;
  className?: string;
};

export default function VehicleCard({
  vehicleName,
  km,
  transmission,
  imageSrc = "/hero.jpg",
  Price,
  className = "",
}: VehicleCardProps) {
  return (
    <article
      className={`w-full max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:max-w-sm ${className}`}
    >
      <img
        src={imageSrc}
        alt={vehicleName}
        className="h-52 w-full object-cover"
      />

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{vehicleName}</h3>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">KM</p>
            <p className="font-medium">{km}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Transmission
            </p>
            <p className="font-medium">{transmission}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Price
            </p>
            <p className="font-medium">{Price}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
