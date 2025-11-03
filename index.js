// Worker에서 DB 바인딩 변수 'DB'를 사용합니다.
export async function onRequestGet({ env }) {
    try {
        // 모든 문제 조회
        const { results } = await env.DB.prepare(
            `SELECT id, date, question_text, question_image_url FROM Problems ORDER BY id DESC`
        ).all();

        // 각 문제의 선택지 및 풀이 기록도 함께 조회해야 함 (복잡성을 위해 여기서는 생략, 실제로는 JOIN 또는 여러 쿼리 사용)
        
        // 간단한 응답 (문제 기본 정보만)
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}