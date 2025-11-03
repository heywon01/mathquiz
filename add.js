// Cloudflare Pages Worker (functions/api/problems/add.js)
export async function onRequestPost({ request, env }) {
    if (request.headers.get("Content-Type") !== "application/json") {
        return new Response(JSON.stringify({ message: "JSON 데이터가 필요합니다." }), { status: 400 });
    }

    try {
        const problemData = await request.json();
        
        // 1. 문제 (Problems) 테이블에 삽입
        const problemResult = await env.DB.prepare(`
            INSERT INTO Problems (date, question_text, question_image_url) 
            VALUES (?, ?, ?)
        `).bind(
            problemData.date, 
            problemData.question.text, 
            problemData.question.image // Base64 데이터가 넘어옵니다. (R2 사용 시 URL로 변경 필요)
        ).run();

        // 삽입된 문제의 ID를 가져옵니다.
        // run() 메소드의 meta 객체에서 last_row_id를 직접 가져옵니다.
        const newProblemId = problemResult.meta.last_row_id;
        
        if (!newProblemId) {
            throw new Error("문제 ID를 가져오는 데 실패했습니다.");
        }
        
        // 2. 선택지 (Options) 테이블에 반복하여 삽입할 쿼리 준비
        const optionStatements = problemData.options.map((option, index) => {
             return env.DB.prepare(
                `INSERT INTO Options (problem_id, option_index, option_text, option_image_url, is_correct) 
                 VALUES (?, ?, ?, ?, ?)`
             ).bind(
                newProblemId,
                index,
                option.text,
                option.image,
                option.isCorrect ? 1 : 0 // JS의 true/false를 DB의 정수(1/0)로 변환
             );
        });

        // 3. 선택지 삽입을 하나의 배치(batch)로 실행하여 효율성을 높입니다.
        await env.DB.batch(optionStatements);

        // 프런트엔드에 성공 응답 (DB가 생성한 ID를 포함하여 반환할 수도 있습니다.)
        return new Response(JSON.stringify({ id: newProblemId, message: "문제 추가 성공" }), {
            headers: { 'Content-Type': 'application/json' },
            status: 201
        });

    } catch (error) {
        console.error("Problem adding failed:", error);
        return new Response(JSON.stringify({ message: `DB 처리 오류: ${error.message}` }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}