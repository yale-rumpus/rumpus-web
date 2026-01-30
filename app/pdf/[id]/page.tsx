interface Props {
    params: { id: string };
}

export default function PDFViewer({ params }: Props) {
    const { id } = params;

    return (
        <main style={{ padding: "1rem" }}>
            <a href={`https://drive.google.com/uc?export=download&id=${id}`} target="_blank" rel="noopener noreferrer">
                Download PDF
            </a>

            <iframe
                src={`https://drive.google.com/file/d/${id}/preview`}
                width="100%"
                height="900"
                style={{ border: "none", marginTop: "1rem" }}
                loading="lazy"
            />
        </main>
    );
}
