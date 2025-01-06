'use client'

import { Layer, Map, Source } from "@vis.gl/react-maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import arakawa_line from '../public/arakawa_line.json';
import arakawa_line_stations from '../public/arakawa_line_stations.json';
import { useMemo, useState } from "react";
import { point } from "@turf/helpers";
import distance from "@turf/distance";
import lineSlice from "@turf/line-slice";
import { Feature, LineString } from "geojson";
import length from "@turf/length";
import { useLocation, usePosition } from "./hooks";

export default function Page() {
    const stationNames = useMemo(() => {
        const names = arakawa_line_stations.features
            .map((station) => station.properties.name)
            .toReversed();
        return names;
    }, []);

    const [selectedStationName, setSelectedStationName] = useState(stationNames[0]);
    const [previousPosition, setPreviousPosition] = usePosition();
    const [currentPosition, setCurrentPosition] = usePosition();
    const [selectedStationPosition, setSelectedStationPosition] = useState(arakawa_line_stations.features.find(feature => feature.properties.name === selectedStationName).geometry.coordinates);

    const updatePosition = (position: { longitude: number, latitude: number }) => {
        setPreviousPosition(currentPosition);
        setCurrentPosition(position);
    }

    useLocation(updatePosition);

    const lineDistance = useMemo(() => {
        const current = point([currentPosition.longitude, currentPosition.latitude])
        const line = arakawa_line.features[0] as Feature<LineString>
        const slicedLine = lineSlice(current, selectedStationPosition, line)
        return length(slicedLine)
    }, [currentPosition, selectedStationPosition])

    const absoluteDistance = useMemo(() => {
        const current = point([currentPosition.longitude, currentPosition.latitude])
        return distance(current, selectedStationPosition);
    }, [currentPosition, selectedStationPosition]);

    const handleChangeStation = (name: string) => {
        const selectedGeometry = arakawa_line_stations.features.find(feature => feature.properties.name === name)
        setSelectedStationName(name);
        setSelectedStationPosition(selectedGeometry.geometry.coordinates);
    }

    const currentSpeed = useMemo(() => {
        const current = point([currentPosition.longitude, currentPosition.latitude]);
        const previous = point([previousPosition.longitude, previousPosition.latitude]);
        const currentDistance = distance(current, previous);
        return currentDistance * 3600;
    }, [currentPosition, previousPosition]);

    // TODO: 動き始めたかどうかの制御がついてないので直す
    const elapsedTime = useMemo(() => {
        if (currentSpeed > 5) {
            const elapsedTime = lineDistance / currentSpeed;
            return new Date(elapsedTime * 3600 * 1000);
        } else {
            const defaultSpeed = 13.1 // km/h
            const defaultElapsedTime = lineDistance / defaultSpeed;
            return new Date(defaultElapsedTime * 3600 * 1000);
        }
    }, [lineDistance, currentSpeed]);

    return (
        <div>
            <div>
                <Map
                    initialViewState={{
                        longitude: 139.7918319,
                        latitude: 35.7318969,
                        zoom: 14,
                    }}
                    style={{ width: '100%', height: 400 }}
                    mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
                >
                    <Source type="geojson" data={arakawa_line}>
                        <Layer type='line' />
                    </Source>
                    <Source type="geojson" data={arakawa_line_stations}>
                        <Layer type='circle' paint={{ 'circle-radius': 10 }} />
                    </Source>
                </Map>
            </div>
            <div className="p-4 flex flex-col space-y-4">
                <div>
                    <select onChange={e => handleChangeStation(e.target.value)} className="w-full p-2 rounded-lg">
                        {stationNames.map((name) => <option key={name}>{name}</option>)}
                    </select>
                </div>
                <div>
                    <p>現在地から{selectedStationName}までのキロ程</p>
                    <p className="text-2xl p-2">{lineDistance.toFixed(2)} km</p>
                </div>
                <div>
                    <p>現在地から{selectedStationName}までの直線距離</p>
                    <p className="text-2xl p-2">{absoluteDistance.toFixed(2)} km</p>
                </div>
                <div>
                    <p>現在地から{selectedStationName}の到着まであと</p>
                    <p className="text-2xl p-2">{elapsedTime.getMinutes()} 分 {elapsedTime.getSeconds()} 秒</p>
                </div>
                <div>
                    <p>移動速度</p>
                    <p className="text-2xl p-2">{currentSpeed.toFixed(2)} km/h</p>
                </div>
            </div>

        </div>
    )
}
