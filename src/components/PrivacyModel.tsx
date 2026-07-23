type PrivacyModalProps = {
  onAccept: () => void;
};

export default function PrivacyModal({
  onAccept,
}: PrivacyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-2xl font-bold">
          Welcome to LiveVote
        </h1>

        <p className="mb-6 text-gray-700">
            Welcome to LiveVote

            Before using LiveVote, please read the following information.

            Privacy Notice

            LiveVote is an educational project created for learning and demonstration purposes.

            By continuing, you understand and agree to the following:

            LiveVote does not require you to create an account.
            The application stores anonymous browser identifiers (creator and voter tokens) in your browser's local storage. These tokens are used only to:
            Remember the polls you created on this browser.
            Help prevent duplicate voting from the same browser.
            LiveVote does not intentionally collect personal information such as your name, email address, password, or phone number.
            Poll questions, options, and votes are stored in the project's database.
            Do not include confidential, sensitive, or personal information in your poll questions or poll options.
            If you clear your browser data, switch browsers, or use another device, you may lose access to the dashboard containing polls created from your original browser.
            This project is provided for demonstration and educational purposes without any guarantee of availability or data retention.

                By selecting "I Understand", you acknowledge that you have read this notice and wish to continue using LiveVote.
        </p>

        <button
          onClick={onAccept}
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}