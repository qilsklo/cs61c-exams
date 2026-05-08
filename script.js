// Assuming EXAM_FILES is defined in data.js
const grid = document.getElementById('examGrid');
const searchInput = document.getElementById('searchInput');
const semesterFilter = document.getElementById('semesterFilter');

function parseFiles(files) {
    const data = {};
    
    files.forEach(file => {
        // Match term and year, e.g., Fa18, fa20, Sp21
        const termYearMatch = file.match(/^(fa|sp|su)(\d{2})/i);
        if (!termYearMatch) return;
        
        const termRaw = termYearMatch[1].toLowerCase();
        const yearRaw = termYearMatch[2];
        const year = "20" + yearRaw;
        
        let termName = "";
        let termCode = 0;
        if (termRaw === 'fa') { termName = "Fall"; termCode = 3; }
        else if (termRaw === 'sp') { termName = "Spring"; termCode = 1; }
        else if (termRaw === 'su') { termName = "Summer"; termCode = 2; }
        
        const semesterKey = `${termName} ${year}`;
        const sortKey = parseInt(year) * 10 + termCode;
        
        if (!data[semesterKey]) {
            data[semesterKey] = {
                title: semesterKey,
                termName: termName,
                year: year,
                sortKey: sortKey,
                exams: {}
            };
        }
        
        const lowerFile = file.toLowerCase();
        
        // Determine Exam Type
        let examType = "Other";
        if (lowerFile.includes('final')) examType = "Final";
        else if (lowerFile.includes('mt1') || lowerFile.includes('midterm-1')) examType = "Midterm 1";
        else if (lowerFile.includes('mt2') || lowerFile.includes('midterm-2')) examType = "Midterm 2";
        else if (lowerFile.includes('mt') || lowerFile.includes('midterm')) examType = "Midterm";
        else if (lowerFile.includes('quest')) examType = "Quest";
        
        if (!data[semesterKey].exams[examType]) {
            data[semesterKey].exams[examType] = {};
        }
        
        // Determine Doc Type
        if (lowerFile.includes('rewritten')) {
            data[semesterKey].exams[examType].rewritten = file;
        } else if (lowerFile.includes('sol')) {
            data[semesterKey].exams[examType].sols = file;
        } else if (lowerFile.includes('blank')) {
            data[semesterKey].exams[examType].blank = file;
        } else {
            data[semesterKey].exams[examType].other = file;
        }
    });
    
    // Convert to sorted array (newest first)
    return Object.values(data).sort((a, b) => b.sortKey - a.sortKey);
}

const parsedData = parseFiles(EXAM_FILES);

function renderGrid(data) {
    grid.innerHTML = '';
    
    if (data.length === 0) {
        grid.innerHTML = '<div class="empty-state">No exams found matching your criteria.</div>';
        return;
    }
    
    data.forEach((semester, index) => {
        const card = document.createElement('div');
        card.className = 'semester-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        let examsHtml = '';
        
        // Sort exam types: Quest -> Midterm 1 -> Midterm 2 -> Midterm -> Final
        const typeOrder = { "Quest": 1, "Midterm 1": 2, "Midterm 2": 3, "Midterm": 4, "Final": 5, "Other": 6 };
        
        const examTypes = Object.keys(semester.exams).sort((a, b) => typeOrder[a] - typeOrder[b]);
        
        examTypes.forEach(type => {
            const docs = semester.exams[type];
            let buttonsHtml = '';
            
            if (docs.blank) {
                buttonsHtml += `<a href="exam-pdfs/${docs.blank}" target="_blank" class="pdf-link pdf-blank">Blank</a>`;
            }
            if (docs.sols) {
                buttonsHtml += `<a href="exam-pdfs/${docs.sols}" target="_blank" class="pdf-link pdf-sols">Solutions</a>`;
            }
            if (docs.rewritten) {
                buttonsHtml += `<a href="exam-pdfs/${docs.rewritten}" target="_blank" class="pdf-link pdf-rewritten">Rewritten</a>`;
            }
            if (docs.other) {
                buttonsHtml += `<a href="exam-pdfs/${docs.other}" target="_blank" class="pdf-link pdf-blank">View</a>`;
            }
            
            examsHtml += `
                <div class="exam-section">
                    <div class="exam-type">${type}</div>
                    <div class="button-group">
                        ${buttonsHtml}
                    </div>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="semester-title">
                ${semester.title}
                <span class="semester-badge">${semester.termName.substring(0,2)} '${semester.year.substring(2)}</span>
            </div>
            <div class="exam-content">
                ${examsHtml}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function filterData() {
    const query = searchInput.value.toLowerCase();
    const term = semesterFilter.value.toLowerCase();
    
    const filtered = parsedData.filter(semester => {
        // Match term
        if (term !== 'all' && !semester.termName.toLowerCase().startsWith(term)) {
            return false;
        }
        
        // Match search query
        if (query) {
            const matchTitle = semester.title.toLowerCase().includes(query);
            // Check if any exam type matches the query (e.g., "midterm", "mt1")
            const matchExams = Object.keys(semester.exams).some(type => type.toLowerCase().includes(query));
            
            if (!matchTitle && !matchExams) {
                return false;
            }
        }
        
        return true;
    });
    
    renderGrid(filtered);
}

searchInput.addEventListener('input', filterData);
semesterFilter.addEventListener('change', filterData);

// Initial Render
renderGrid(parsedData);
