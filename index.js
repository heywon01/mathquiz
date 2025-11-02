// functions/api/users/index.js
export async function onRequest({ request, env }) {
    const url = new URL(request.url);

    // GET 요청: 모든 사용자 목록 조회 (loadUsers 함수 대응)
    if (request.method === 'GET') {
        try {
            const { results } = await env.DB.prepare(`SELECT id, name, isAdmin FROM Users`).all();
            
            // DB의 0/1을 JS의 true/false로 변환하여 반환
            const users = results.map(user => ({
                id: user.id,
                name: user.name,
                isAdmin: user.isAdmin === 1 
            }));
            
            return new Response(JSON.stringify(users), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        } catch (error) {
            return new Response(JSON.stringify({ message: `사용자 목록 로드 실패: ${error.message}` }), { status: 500 });
        }
    }

    // POST 요청: 사용자 등록 또는 로그인 (registerUser 함수 대응)
    if (request.method === 'POST') {
        try {
            const { name } = await request.json();
            const trimmedName = name.trim();
            if (!trimmedName) throw new Error("이름을 입력해야 합니다.");

            // 1. 기존 사용자 조회
            let userResult = await env.DB.prepare(`SELECT id, name, isAdmin FROM Users WHERE name = ?`).bind(trimmedName).first();

            // 2. 사용자가 없는 경우: 신규 사용자 등록
            if (!userResult) {
                const newUserId = 'user' + Date.now(); // 기존 JS 로직과 유사하게 ID 생성
                const isAdmin = (newUserId === '1234aa' ? 1 : 0); // 관리자 ID는 직접 설정 필요 (보안상 좋지 않으나 기존 로직 유지)
                
                await env.DB.prepare(`
                    INSERT INTO Users (id, name, isAdmin) VALUES (?, ?, ?)
                `).bind(newUserId, trimmedName, isAdmin).run();
                
                userResult = { id: newUserId, name: trimmedName, isAdmin: isAdmin };
            }

            // 3. 응답 (DB의 0/1을 JS의 true/false로 변환)
            const userData = {
                id: userResult.id,
                name: userResult.name,
                isAdmin: userResult.isAdmin === 1
            };

            return new Response(JSON.stringify(userData), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });

        } catch (error) {
            return new Response(JSON.stringify({ message: `사용자 처리 실패: ${error.message}` }), { status: 500 });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
}