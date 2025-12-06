const API_URL = process.env.VITE_API_URL || 'http://localhost:5001/api';
// Use global fetch


async function test() {
    try {
        console.log('Fetching Featured...');
        const resFeatured = await fetch(`${API_URL}/projects/featured`);
        if (resFeatured.ok) {
            const data = await resFeatured.json();
            console.log('Featured Status:', resFeatured.status, 'IsArray:', Array.isArray(data), 'Length:', Array.isArray(data) ? data.length : 'N/A');
        } else {
            console.log('Featured Failed:', resFeatured.status, await resFeatured.text());
        }

        console.log('Fetching All Projects (Page 1, Limit 3)...');
        const resAll = await fetch(`${API_URL}/projects?page=1&limit=3`);
        if (resAll.ok) {
            const data = await resAll.json();
            console.log('All Projects Status:', resAll.status, 'IsArray:', Array.isArray(data), 'Length:', Array.isArray(data) ? data.length : 'N/A');
            if (!Array.isArray(data)) console.log('Response:', data);
        } else {
            console.log('All Projects Failed:', resAll.status, await resAll.text());
        }

    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

test();
