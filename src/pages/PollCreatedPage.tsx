import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

export default function PollCreatedPage() {
    const {id} = useParams();
    const votelink = `${window.location.origin}/vote/${id}`;
    return(
        <div>
            <h1>Poll Created</h1>
            <p>Your poll ID is: {id}</p>
            <p>your poll has been created successfully!</p>
            <QRCodeCanvas value={votelink} />
            <button
            onClick={() => navigator.clipboard.writeText(votelink)}
            >
            Copy Link
            </button>
        </div>
    )

}