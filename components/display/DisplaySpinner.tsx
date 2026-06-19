/** ディスプレイ画面のローディングスピナー */
export default function DisplaySpinner() {
  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}
