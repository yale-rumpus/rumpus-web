"use client";

import dynamic from "next/dynamic";

// Games rely on browser APIs and are loaded on the client.
const DynamicGame = dynamic(() => import("@/components/JizzGame"), {
    ssr: false,
});
const DynamicGame1 = dynamic(() => import("@/components/AssGame"), {
    ssr: false,
});
const DynamicGame2 = dynamic(() => import("@/components/WordleGame"), {
    ssr: false,
});
const DynamicSpermGame = dynamic(() => import("@/components/SpermSurvivors"), {
    ssr: false,
});

export default function DynamicGameWrapper() {
    return (
        <>
            <hr style={{ margin: "20px 0", border: "none", borderTop: "2px solid #ccc" }} />
            <DynamicGame />
            <hr style={{ margin: "20px 0", border: "none", borderTop: "2px solid #ccc" }} />
            <DynamicGame1 />
            <hr style={{ margin: "20px 0", border: "none", borderTop: "2px solid #ccc" }} />
            <DynamicGame2 />
            <hr style={{ margin: "20px 0", border: "none", borderTop: "2px solid #ccc" }} />
            <DynamicSpermGame />
        </>
    );
}
