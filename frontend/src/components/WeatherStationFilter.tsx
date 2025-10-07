import {useEffect, useState} from "react";

import {useStationStore} from "../store.ts";


export const WeatherStationFilter = () => {
    const [stations, setstations] = useState<string[]>([]);  // Just setting a default value
    const {setStationName} = useStationStore();

    useEffect(
        () => {
            (async () => {
                const response = await fetch(`http://127.0.0.1:8000/api/stations`);

                const results = await response.json();

                setstations(results);
            })()
        },
        []
    )

    const handleClick = (stationName: string) => {
        setStationName(stationName);
    }

    if (stations.length === 0) return <div>No stations found.</div>;

    return (
        <>
            <h2>Weather Station Filter Component</h2>
            { /* We'll use DaisyUI for the real thing, this is just a quick and dirty example. */ }
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    padding: "10px",
                }}
            >
                {Object.values(stations).map((stationName, i) => (
                    <div
                        onClick={() => handleClick(stationName)}
                        style={{
                            cursor: "pointer",
                            padding: "10px",
                            border: "1px solid #999",
                            borderRadius: "4px",
                            textAlign: "center",
                            userSelect: "none",
                        }}
                    >
                        {stationName}
                    </div>
                ))}
            </div>
        </>
    );
};
