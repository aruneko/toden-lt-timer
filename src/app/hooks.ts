import { useEffect, useState } from "react";

export function usePosition(): [{ longitude: number, latitude: number }, (position: { longitude: number, latitude: number }) => void] {
    const [position, _setPosition] = useState({ longitude: 139.7918319, latitude: 35.7318969 });
    const setPosition = (position: { longitude: number, latitude: number }) => {
        _setPosition(position)
    }
    return [position, setPosition]
}

export function useLocation(callback: (position: { longitude: number, latitude: number }) => void) {
    const onTick = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { longitude, latitude } = position.coords
            callback({ longitude, latitude })
        }, (err) => {
            console.error(err)
        })
    }

    useEffect(() => {
        const id = setInterval(() => {
            onTick()
        }, 1000)
        return () => {
            clearInterval(id)
        }
    })
}
