/**
 * Utility functions for geographical calculations
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<{lat: number, lng: number}>} User's coordinates
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.warn('Error getting location:', error);
                // Fallback to Ho Chi Minh City center if geolocation fails
                resolve({
                    lat: 10.8231,
                    lng: 106.6297
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
};

/**
 * Calculate distance from user location to a branch
 * @param {Object} branch - Branch object with location coordinates
 * @param {Object} userLocation - User's current location {lat, lng}
 * @returns {number} Distance in kilometers
 */
export const getBranchDistance = (branch, userLocation) => {
    if (!branch.location || !userLocation) return null;

    let branchLat, branchLng;

    if (typeof branch.location === 'string') {
        // If location is a string, try to parse it
        const coords = branch.location.split(',').map(coord => parseFloat(coord.trim()));
        if (coords.length >= 2) {
            branchLat = coords[0];
            branchLng = coords[1];
        } else {
            return null;
        }
    } else if (branch.location.coordinates && Array.isArray(branch.location.coordinates)) {
        // GeoJSON format: [longitude, latitude]
        branchLng = branch.location.coordinates[0];
        branchLat = branch.location.coordinates[1];
    } else {
        return null;
    }

    return calculateDistance(
        userLocation.lat,
        userLocation.lng,
        branchLat,
        branchLng
    );
};

/**
 * Sort branches by distance from user location
 * @param {Array} branches - Array of branch objects
 * @param {Object} userLocation - User's current location {lat, lng}
 * @returns {Array} Sorted branches array (closest first)
 */
export const sortBranchesByDistance = (branches, userLocation) => {
    if (!userLocation) return branches;

    return branches
        .map(branch => ({
            ...branch,
            distance: getBranchDistance(branch, userLocation)
        }))
        .filter(branch => branch.distance !== null)
        .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'N/A';
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
};

export default {
    calculateDistance,
    getCurrentLocation,
    getBranchDistance,
    sortBranchesByDistance,
    formatDistance
};
