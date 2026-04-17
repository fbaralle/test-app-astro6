import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.PUBLIC_APP_API_PATH || "";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

interface FavoritesResponse {
  favorites: Favorite[];
}

async function fetchFavorites(): Promise<Favorite[]> {
  const res = await fetch(`${basePath}/api/favorites`);
  if (!res.ok) {
    throw new Error("Failed to fetch favorites");
  }
  const data: FavoritesResponse = await res.json();
  return data.favorites;
}

async function addFavorite(coin: {
  coin_id: string;
  coin_name?: string;
  coin_symbol?: string;
  coin_image?: string;
}): Promise<void> {
  const res = await fetch(`${basePath}/api/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coin),
  });
  if (!res.ok) {
    throw new Error("Failed to add favorite");
  }
}

async function removeFavorite(coinId: string): Promise<void> {
  const res = await fetch(`${basePath}/api/favorites?coin_id=${encodeURIComponent(coinId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to remove favorite");
  }
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    retry: false,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFavorite,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFavorite,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export default function FavoritesSection() {
  const { data: favorites = [], isLoading, error } = useFavorites();
  const removeMutation = useRemoveFavorite();

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <p className="text-red-500 dark:text-red-400">
          Failed to load favorites. Please try again later.
        </p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          No favorites yet. Click the star icon on any coin to add it to your favorites.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Your Favorites
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="flex-shrink-0 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm min-w-[180px]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {fav.coin_image && (
                  <img
                    src={fav.coin_image}
                    alt={fav.coin_name || fav.coin_id}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {fav.coin_name || fav.coin_id}
                </span>
              </div>
              <button
                onClick={() => removeMutation.mutate(fav.coin_id)}
                disabled={removeMutation.isPending}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Remove from favorites"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {fav.coin_symbol && (
              <span className="text-xs text-gray-400 uppercase">
                {fav.coin_symbol}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
