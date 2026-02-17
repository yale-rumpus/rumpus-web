import "./archive.css";

import archive from "@/data/archive.json";
import Link from "next/link";

export default function Home() {
    return (
        <main className="archive-main">
            <div className="archive-header">
                <h1>PDF Archive</h1>
                <p>Explore our collection of past publications</p>
            </div>

            {Object.entries(archive)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, files]) => (
                    <section key={year} className="issue-card">
                        <h2>{year}</h2>
                        <div className="link-grid">
                            {files.map((file: any) => (
                                <div key={file.id} className="link-box">
                                    <Link href={`/pdf/${file.id}`}>{file.title}</Link>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
        </main>
    );
}
