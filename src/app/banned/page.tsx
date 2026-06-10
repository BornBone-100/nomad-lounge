/**
 * /banned — 영구 정지 안내 화면
 * 탈퇴 처리된 유저가 접속 시 미들웨어에 의해 여기로 리다이렉트됨
 */
export const dynamic = "force-dynamic";

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* 아이콘 */}
      <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
        <span className="text-4xl">🚫</span>
      </div>

      {/* 제목 */}
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        계정이 영구 정지되었습니다
      </h1>

      {/* 본문 */}
      <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-xs">
        커뮤니티 이용 규정을 반복적으로 위반하여 계정이 영구 정지되었습니다.
        NomadLounge는 모든 여행자가 안전하게 연결될 수 있는 공간을 만들기 위해
        이러한 조치를 취하고 있습니다.
      </p>

      {/* 정지 사유 카드 */}
      <div className="w-full max-w-xs bg-red-50 rounded-2xl p-4 mb-8 text-left space-y-2">
        <p className="text-xs font-bold text-red-700">정지 사유에 해당하는 행위</p>
        {[
          "욕설·성희롱·혐오 발언",
          "스캠·사기·피싱 링크 공유",
          "반복적인 비매너 행동",
          "커뮤니티 가이드라인 다중 위반",
        ].map((r) => (
          <div key={r} className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span className="text-xs text-red-600">{r}</span>
          </div>
        ))}
      </div>

      {/* 이의 제기 안내 */}
      <p className="text-xs text-gray-400 leading-relaxed">
        정지 처리가 부당하다고 생각하시면<br />
        <span className="text-primary font-semibold">support@nomadlounge.app</span>으로
        문의해주세요.
      </p>
    </div>
  );
}
