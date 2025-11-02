import { useState, useEffect } from 'react';

interface FavoriteExercise {
    exerciseId: string;
    addedAt: Date;
    notes?: string;
}

export const useExerciseFavorites = () => {
    const [favorites, setFavorites] = useState<FavoriteExercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load favorites from localStorage on mount
    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = () => {
        try {
            const stored = localStorage.getItem('exercise-favorites');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                const favorites = parsed.map((fav: any) => ({
                    ...fav,
                    addedAt: new Date(fav.addedAt)
                }));
                setFavorites(favorites);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            setFavorites([]);
        }
    };

    const saveFavorites = (newFavorites: FavoriteExercise[]) => {
        try {
            localStorage.setItem('exercise-favorites', JSON.stringify(newFavorites));
            setFavorites(newFavorites);
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const addToFavorites = (exerciseId: string, notes?: string) => {
        setIsLoading(true);
        try {
            const newFavorite: FavoriteExercise = {
                exerciseId,
                addedAt: new Date(),
                notes
            };
            
            const updatedFavorites = [...favorites, newFavorite];
            saveFavorites(updatedFavorites);
        } catch (error) {
            console.error('Error adding to favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromFavorites = (exerciseId: string) => {
        setIsLoading(true);
        try {
            const updatedFavorites = favorites.filter(fav => fav.exerciseId !== exerciseId);
            saveFavorites(updatedFavorites);
        } catch (error) {
            console.error('Error removing from favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateFavoriteNotes = (exerciseId: string, notes: string) => {
        setIsLoading(true);
        try {
            const updatedFavorites = favorites.map(fav => 
                fav.exerciseId === exerciseId 
                    ? { ...fav, notes }
                    : fav
            );
            saveFavorites(updatedFavorites);
        } catch (error) {
            console.error('Error updating favorite notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isFavorite = (exerciseId: string): boolean => {
        return favorites.some(fav => fav.exerciseId === exerciseId);
    };

    const getFavorite = (exerciseId: string): FavoriteExercise | undefined => {
        return favorites.find(fav => fav.exerciseId === exerciseId);
    };

    const clearAllFavorites = () => {
        setIsLoading(true);
        try {
            localStorage.removeItem('exercise-favorites');
            setFavorites([]);
        } catch (error) {
            console.error('Error clearing favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportFavorites = (): string => {
        return JSON.stringify(favorites, null, 2);
    };

    const importFavorites = (data: string): boolean => {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                const favorites = parsed.map((fav: any) => ({
                    ...fav,
                    addedAt: new Date(fav.addedAt)
                }));
                saveFavorites(favorites);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing favorites:', error);
            return false;
        }
    };

    return {
        favorites,
        isLoading,
        addToFavorites,
        removeFromFavorites,
        updateFavoriteNotes,
        isFavorite,
        getFavorite,
        clearAllFavorites,
        exportFavorites,
        importFavorites,
        totalFavorites: favorites.length
    };
};
