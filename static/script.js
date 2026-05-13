// SCI Title Page Generator — Frontend Logic

const rawInput = document.getElementById("raw-input");
const parseBtn = document.getElementById("parse-btn");
const parseStatus = document.getElementById("parse-status");
const formPanel = document.getElementById("form-panel");
const titleInput = document.getElementById("title-input");
const filenameInput = document.getElementById("filename-input");
const authorsContainer = document.getElementById("authors-container");
const affiliationsContainer = document.getElementById("affiliations-container");
const fundInput = document.getElementById("fund-input");
const generateBtn = document.getElementById("generate-btn");
const genStatus = document.getElementById("gen-status");

// File upload elements
const fileInput = document.getElementById("file-input");
const uploadZone = document.getElementById("upload-zone");
const browseBtn = document.getElementById("browse-btn");
const fileInfo = document.getElementById("file-info");

let authorCounter = 0;
let affCounter = 0;

// ===================== File Upload =====================

browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
});

uploadZone.addEventListener("click", () => fileInput.click());

// Drag and drop
uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

async function handleFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["doc", "docx"].includes(ext)) {
        showFileError("仅支持 .doc 和 .docx 格式");
        return;
    }

    showFileInfo("正在提取文字...");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const resp = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        const data = await resp.json();

        if (!resp.ok) {
            showFileError(data.error || "上传失败");
            return;
        }

        // Fill textarea with extracted text
        rawInput.value = data.text;
        showFileInfo(`已提取: ${file.name} (${data.text.length} 字符)`);

        // Auto-parse
        doParse();
    } catch (e) {
        showFileError("上传失败: " + e.message);
    }
}

function showFileInfo(msg) {
    fileInfo.style.display = "block";
    fileInfo.className = "";
    fileInfo.textContent = msg;
}

function showFileError(msg) {
    fileInfo.style.display = "block";
    fileInfo.className = "error";
    fileInfo.textContent = msg;
}

// ===================== Affiliation Splitting =====================

function splitAffiliationLines(rawText) {
    if (!rawText) return rawText;
    let text = rawText.trim();

    const uniMatch = text.match(/^(.+)\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:University|College|Institute))\b,?\s*(.*)$/);
    if (uniMatch) {
        let dept = uniMatch[1].trim().replace(/[,，\s]+$/, "");
        let uni = uniMatch[2].trim();
        let loc = uniMatch[3].trim().replace(/^[,，\s]+/, "");

        if (dept && uni && loc) {
            return dept + ",\n" + uni + ",\n" + loc;
        }
        if (dept && uni) {
            return dept + ",\n" + uni + (loc ? ",\n" + loc : "");
        }
    }

    const commaParts = text.split(/[,，]/).map(s => s.trim()).filter(s => s);
    if (commaParts.length >= 3) {
        return commaParts[0] + ",\n" + commaParts[1] + ",\n" + commaParts.slice(2).join(", ");
    }

    return text;
}

function joinAffLines(lines) {
    if (!lines || lines.length === 0) return "";
    if (lines.length === 1) {
        return splitAffiliationLines(lines[0]);
    }
    return lines.join("\n");
}

// ===================== Parsing Logic =====================

function detectFormat(text) {
    const keywords = ["作者信息表", "订单编号", "附件说明", "作者简介", "填写说明",
        "第一作者", "第二作者", "第三作者", "通讯作者", "通讯信息",
        "author name", "Corresponding author"];
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    return matchCount >= 2 ? "B" : "A";
}

function parseFormatA(text) {
    const lines = text.split(/\n/).map(l => l.trim()).filter(l => l);
    const result = { authors: [], affiliations: [], fundInfo: [] };

    let name = "", email = "";
    const affLines = [];

    for (const line of lines) {
        if (/密码/.test(line)) {
            continue;
        }
        const authMatch = line.match(/^Author\s*[:：]\s*(.+)/i);
        if (authMatch) {
            name = authMatch[1].trim();
            continue;
        }
        const affMatch = line.match(/^Affiliation\s*[:：]\s*(.+)/i);
        if (affMatch) {
            const aff = affMatch[1].trim();
            const cleanAff = aff.replace(/邮编[：:]\s*\d+/g, "").replace(/\s*，\s*/g, ", ").trim();
            affLines.push(cleanAff);
            continue;
        }
        const emailMatch = line.match(/^Email\s*[:：]\s*(.+)/i);
        if (emailMatch) {
            const emails = emailMatch[1].split(/[,;]/).map(e => e.trim()).filter(e => !/qq\.com/i.test(e));
            if (emails.length > 0) email = emails[0];
            continue;
        }
        if (/@/.test(line) && !/qq\.com/i.test(line) && !/密码/.test(line)) {
            const parts = line.split(/[,;，；\s]+/);
            for (const p of parts) {
                if (p.includes("@") && !/qq\.com/i.test(p)) {
                    email = p.replace(/[，,].*$/, "").trim();
                    break;
                }
            }
        }
    }

    if (name) {
        result.authors.push({
            id: ++authorCounter,
            name: name,
            isCorresponding: true,
            affiliationNums: "1",
            email: email,
            title: ""
        });
    }

    if (affLines.length > 0) {
        result.affiliations.push({
            id: ++affCounter,
            num: 1,
            lines: joinAffLines(affLines)
        });
    }

    return result;
}

function parseFormatB(text) {
    const result = { authors: [], affiliations: [], fundInfo: [] };
    const lines = text.split(/\n/);

    // --- Find English fund information ---
    let fullText = text;
    const fundSection = fullText.match(/(?:基金信息|项目信息)([\s\S]*?)(?=发票信息|填写说明|邮箱信息|$)/);
    if (fundSection) {
        const fundBlock = fundSection[1];
        const stageMatch = fundBlock.match(/^Stage\s+[A].+?(?:\n|$)/m);
        if (stageMatch) {
            let fundLine = "1." + stageMatch[0].trim();
            const afterStage = fundBlock.substring(fundBlock.indexOf(stageMatch[0]) + stageMatch[0].length);
            const contMatch = afterStage.match(/^(Plan\s+of.+?|Project\s+No.+?)(?:\n|$)/m);
            if (contMatch) {
                fundLine += " " + contMatch[1].trim();
            }
            const grantMatch = afterStage.match(/(?:Project No\.?|Grant No\.?)[：:.]?\s*(.+?)(?:\n|$)/i);
            if (grantMatch) {
                fundLine += " (No.: " + grantMatch[1].trim() + ")";
            }
            result.fundInfo.push(fundLine);
        } else {
            const enSection = fundBlock.match(/英文[：:][\s\S]*$/i);
            if (enSection) {
                const enLines = enSection[0].split(/\n/);
                for (const line of enLines) {
                    const numberedMatch = line.trim().match(/^(\d+)[\.\、]\s*(.+)/);
                    if (numberedMatch) {
                        result.fundInfo.push(numberedMatch[1] + "." + numberedMatch[2].trim());
                    }
                }
            }
            if (result.fundInfo.length === 0) {
                const enFundMatch = fundBlock.match(/(?:英文名称|课题|英文)[：:]?\s*\n?\s*(.+?)(?:\n|$)/i);
                if (enFundMatch && !/以下是/.test(enFundMatch[1])) {
                    result.fundInfo.push("1." + enFundMatch[1].trim());
                }
                const numMatch = fundBlock.match(/(?:基金编号|Grant No\.?|编号|Project No\.?)[：:]?\s*\n?\s*(.+?)(?:\n|$)/i);
                if (numMatch && result.fundInfo.length > 0) {
                    result.fundInfo[0] += " " + numMatch[1].trim();
                }
            }
        }
    }

    // --- Check for 田维飞-style format (has "author name1：") ---
    const hasNumberedAuthors = /author name\d+\s*[：:]/.test(text);

    if (hasNumberedAuthors) {
        const authorMap = {};

        const authMatches = text.matchAll(/author name(\d+)\s*[：:]\s*(.+)/gi);
        for (const m of authMatches) {
            const num = parseInt(m[1]);
            let rawName = m[2].trim();
            rawName = rawName.replace(/[，,]/g, " ").replace(/\s+/g, " ").trim();
            rawName = rawName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            if (!authorMap[num]) authorMap[num] = { name: rawName, isCorr: false };
        }

        const corrMatch = text.match(/Corresponding author(?:'s)?\s*[：:]\s*(.+)/i);
        if (corrMatch) {
            let rawName = corrMatch[1].trim();
            rawName = rawName.replace(/[，,]/g, " ").replace(/\s+/g, " ").trim();
            rawName = rawName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            const existingKeys = Object.keys(authorMap);
            const lastKey = existingKeys.length > 0 ? Math.max(...existingKeys.map(Number)) + 1 : 1;
            authorMap[lastKey] = { name: rawName, isCorr: true };
        }

        const affSection = text.match(/机构信息[\s\S]*?(?=所有作者|作者排序|课题|标题)/i);
        if (affSection) {
            const affBlock = affSection[0];
            const affMatches = affBlock.matchAll(/(\d+)[、，,]\s*(.+?)(?=\n\s*\d+[、，,]|$)/gs);
            for (const m of affMatches) {
                const num = parseInt(m[1]);
                let affText = m[2].trim();
                affText = affText.replace(/通讯作者地址.*?[：:]/g, "").replace(/\(Corresponding author.*?\)/gi, "");
                affText = affText.replace(/^[^a-zA-Z]*/, "").trim();
                const affLines = affText.split(/[,，]/).map(s => s.trim()).filter(s => s);
                if (affLines.length > 0) {
                    result.affiliations.push({
                        id: ++affCounter,
                        num: num,
                        lines: joinAffLines(affLines)
                    });
                }
            }
        }

        const emailSection = text.match(/Email address list[\s\S]*?(?=标题|课题|作者排序|$)/i);
        if (emailSection) {
            const emailBlock = emailSection[0];
            const emailMatches = emailBlock.matchAll(/(\d+)[、，]\s*(?:Corresponding author|author name)?[：:]?\s*([^\s@]+@[^\s]+)/gi);
            for (const m of emailMatches) {
                const num = parseInt(m[1]);
                const email = m[2].trim();
                if (authorMap[num]) {
                    authorMap[num].email = email;
                }
            }
        }

        const sortedNums = Object.keys(authorMap).map(Number).sort((a, b) => a - b);
        for (const num of sortedNums) {
            const a = authorMap[num];
            result.authors.push({
                id: ++authorCounter,
                name: a.name,
                isCorresponding: a.isCorr,
                affiliationNums: String(a.isCorr ? num : num),
                email: a.email || "",
                title: ""
            });
        }

        return result;
    }

    // --- 张亚飞-style: English author line with superscript numbers ---
    const hasEnglishAuthorLine = /[A-Z][a-z]+\s+[A-Z][a-z]+\d+\*/.test(text);

    if (hasEnglishAuthorLine && result.authors.length === 0) {
        const fullText2 = text;
        const engLine = fullText2.split(/\n/).find(l => /[A-Z][a-z]+\s+[A-Z][a-z]+\d+\*/.test(l));
        if (engLine) {
            const nameRegex = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g;
            const names = [];
            let m;
            while ((m = nameRegex.exec(engLine)) !== null) {
                names.push(m[1]);
            }
            const markerRegex = /(\d+)(\*)?/g;
            const markers = [];
            let markerMatch;
            const afterNames = engLine.replace(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/g, "|||");
            while ((markerMatch = markerRegex.exec(afterNames)) !== null) {
                markers.push({
                    num: markerMatch[1],
                    isCorr: !!markerMatch[2]
                });
            }

            for (let i = 0; i < names.length; i++) {
                result.authors.push({
                    id: ++authorCounter,
                    name: names[i],
                    isCorresponding: markers[i] ? markers[i].isCorr : false,
                    affiliationNums: markers[i] ? markers[i].num : String(i + 1),
                    email: "",
                    title: ""
                });
            }
        }

        // Extract English affiliations
        const textAfterAuthors = text.split(/\n/);
        let affStarted = false;
        let currentAffNum = 0;
        let currentAffLines = [];

        for (const line of textAfterAuthors) {
            const numStart = line.match(/^(\d+)\s+([A-Z].+)/);
            if (numStart && !/邮箱|密码|电话/.test(line)) {
                if (currentAffLines.length > 0 && currentAffNum > 0) {
                    result.affiliations.push({
                        id: ++affCounter,
                        num: currentAffNum,
                        lines: joinAffLines(currentAffLines)
                    });
                }
                currentAffNum = parseInt(numStart[1]);
                currentAffLines = [numStart[2].trim().replace(/[,，;；]\s*$/, "")];
                affStarted = true;
            } else if (affStarted && /^[A-Z]/.test(line.trim()) && !/邮箱|密码|作者简介|项目信息/.test(line)) {
                currentAffLines.push(line.trim().replace(/[,，;；]\s*$/, ""));
            } else if (affStarted && (!line.trim() || /作者简介|邮箱信息|项目信息/.test(line))) {
                if (currentAffLines.length > 0 && currentAffNum > 0) {
                    result.affiliations.push({
                        id: ++affCounter,
                        num: currentAffNum,
                        lines: joinAffLines(currentAffLines)
                    });
                }
                affStarted = false;
                currentAffLines = [];
                currentAffNum = 0;
            }
        }
        if (currentAffLines.length > 0 && currentAffNum > 0) {
            result.affiliations.push({
                id: ++affCounter,
                num: currentAffNum,
                lines: joinAffLines(currentAffLines)
            });
        }
    }

    // --- Hybrid format: Chinese author line + English author line ---
    const hasChineseAuthorLine = /[一-鿿]{2,4}\*?[（(]通讯作者[）)]/.test(text);
    const hasEngAuthorStars = /[A-Z][a-z]+\s+[A-Z][a-z]+\*[,，\s]/.test(text);

    if (hasChineseAuthorLine && hasEngAuthorStars && result.authors.length === 0) {
        const cnLineMatch = text.match(/([一-鿿]{2,4}\*?[（(]通讯作者[）)][，,\s]*[一-鿿，,\s、]+)/);
        if (cnLineMatch) {
            const cnLine = cnLineMatch[1];
            const cnNames = cnLine.split(/[，,、]/).map(s => {
                s = s.trim();
                return {
                    raw: s,
                    isCorr: /[（(]通讯作者[）)]/.test(s) || /\*/.test(s),
                    clean: s.replace(/[*（(]通讯作者[）)]/g, "").trim()
                };
            }).filter(n => n.clean);

            const engLineMatch = text.match(/([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+\*?\s*,?\s*)+/);
            if (engLineMatch) {
                const engLine = engLineMatch[0];
                const engNameRegex = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\*?/g;
                const engNames = [];
                let m;
                while ((m = engNameRegex.exec(engLine)) !== null) {
                    const fullName = m[1].trim();
                    if (fullName.split(/\s+/).length >= 2) {
                        engNames.push({
                            name: fullName,
                            hasStar: engLine.substring(m.index + m[0].length, m.index + m[0].length + 1) === "*"
                        });
                    }
                }

                for (let i = 0; i < Math.min(cnNames.length, engNames.length); i++) {
                    result.authors.push({
                        id: ++authorCounter,
                        name: engNames[i].name,
                        isCorresponding: cnNames[i].isCorr || engNames[i].hasStar,
                        affiliationNums: "",
                        email: "",
                        title: ""
                    });
                }

                const engAffMatch = text.match(/((?:[A-Z][a-zA-Z]+\s*)+University[\s\S]*?(?:\d{5,6}[,\s]*\w+))/i);
                const engAffMatch2 = text.match(/(School\s+of\s+[A-Za-z\s]+?University[,\s]*(?:[A-Z][a-zA-Z\s,]*?\d{5,6}[,\s]*\w+)?)/i);
                const affMatch = engAffMatch2 || engAffMatch;
                if (affMatch) {
                    result.affiliations.push({
                        id: ++affCounter,
                        num: 1,
                        lines: joinAffLines([affMatch[0].trim()])
                    });
                }
            }
        }
    }

    // --- 李海艳/Lei Xu-style: Chinese author labels ---
    const authorLabels = ["第一作者", "第二作者", "第三作者", "第四作者", "第五作者", "通讯作者"];
    const authorBlocks = [];

    if (result.authors.length === 0) {
        for (let i = 0; i < authorLabels.length; i++) {
            const label = authorLabels[i];
            const startIdx = text.indexOf(label);
            if (startIdx === -1) continue;

            const nextLabels = authorLabels.slice(i + 1);
            let endIdx = text.length;
            for (const nl of nextLabels) {
                const idx = text.indexOf(nl, startIdx + label.length);
                if (idx !== -1 && idx < endIdx) {
                    endIdx = idx;
                }
            }
            for (const stop of ["通讯信息", "基金信息", "发票信息"]) {
                const idx = text.indexOf(stop, startIdx + label.length);
                if (idx !== -1 && idx < endIdx) endIdx = idx;
            }

            const block = text.substring(startIdx, endIdx);
            const isCorr = label === "通讯作者";
            authorBlocks.push({ label, block, isCorr });
        }

        for (const ab of authorBlocks) {
            const blockLines = ab.block.split(/\n/);

            let englishStart = -1;
            for (let i = 0; i < blockLines.length; i++) {
                const l = blockLines[i].trim();
                if (/^[一-鿿]/.test(l) || /毕业院校|现在单位|研究方向|邮箱|HYPERLINK/.test(l)) {
                    continue;
                }
                if (/^[A-Z][a-z]+\s+[A-Z]/.test(l) || /^[A-Z][a-z]+[,\s]?$/i.test(l)) {
                    englishStart = i;
                    break;
                }
            }

            if (englishStart === -1) continue;

            let name = "", affLines = [], email = "";
            name = blockLines[englishStart].trim().replace(/[，,]$/, "").trim();

            for (let i = englishStart + 1; i < blockLines.length; i++) {
                const l = blockLines[i].trim();
                if (!l) continue;
                if (/^[一-鿿]/.test(l) || /第[一二三四五六N]作者/.test(l)) break;
                if (/邮箱|账号|密码|电话/.test(l)) break;
                affLines.push(l.replace(/[，,]$/, "").trim());
            }

            const emailMatches = blockLines.join("\n").match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
            if (emailMatches) {
                const validEmails = emailMatches.filter(e => !/qq\.com/i.test(e));
                if (validEmails.length > 0) email = validEmails[0];
            }

            if (name) {
                result.authors.push({
                    id: ++authorCounter,
                    name: name,
                    isCorresponding: ab.isCorr,
                    affiliationNums: "",
                    email: email,
                    title: ""
                });
            }
        }
    }

    // --- Extract affiliations separately ---
    const instSection = text.match(/机构信息[\s\S]*?(?=所有作者|作者排序|作者信息|$)/i);
    if (instSection && result.affiliations.length === 0) {
        const instBlock = instSection[0];
        const instMatches = instBlock.matchAll(/(\d+)[、，,]\s*(.+?)(?=\n\s*\d+[、，,]|$)/gs);
        for (const m of instMatches) {
            const num = parseInt(m[1]);
            let affText = m[2].trim();
            affText = affText.replace(/通讯作者地址.*?[：:]/g, "");
            const affLines = affText.split(/[,，]/).map(s => s.trim()).filter(s => s && s.length > 2);
            if (affLines.length > 0) {
                result.affiliations.push({
                    id: ++affCounter,
                    num: num,
                    lines: joinAffLines(affLines)
                });
            }
        }
    }

    // If no affiliations found, extract from author blocks
    if (result.affiliations.length === 0 && result.authors.length > 0) {
        let affMap = {};
        for (const ab of authorBlocks) {
            const blockLines = ab.block.split(/\n/);
            let englishStart = -1;
            for (let i = 0; i < blockLines.length; i++) {
                const l = blockLines[i].trim();
                if (/^[A-Z][a-z]+\s+[A-Z]/.test(l) || /^[A-Z][a-z]+[,\s]?$/i.test(l)) {
                    englishStart = i;
                    break;
                }
            }
            if (englishStart === -1) continue;

            const affLines = [];
            for (let i = englishStart + 1; i < blockLines.length; i++) {
                const l = blockLines[i].trim();
                if (!l) continue;
                if (/^[一-鿿]/.test(l) || /第[一二三四五六N]作者/.test(l)) break;
                if (/邮箱|账号|密码|电话/.test(l)) break;
                affLines.push(l.replace(/[，,]$/, "").trim());
            }

            if (affLines.length > 0) {
                const affKey = affLines.join("|");
                if (!affMap[affKey]) {
                    affMap[affKey] = { num: Object.keys(affMap).length + 1, lines: joinAffLines(affLines) };
                }
            }
        }

        for (const key of Object.keys(affMap)) {
            result.affiliations.push({
                id: ++affCounter,
                num: affMap[key].num,
                lines: affMap[key].lines
            });
        }
    }

    // --- Extract emails from 通讯信息/邮箱信息 section ---
    const contactSection = text.match(/(?:通讯信息|邮箱信息)[\s\S]*?(?=基金信息|项目信息|发票信息|填写说明|联系电话|$)/);
    if (contactSection) {
        const contactBlock = contactSection[0];
        const emailMatches = contactBlock.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
        const emails = [...emailMatches].map(m => m[1]).filter(e => !/qq\.com/i.test(e));

        for (const author of result.authors) {
            if (!author.email && emails.length > 0) {
                const matchingEmail = emails.find(e => {
                    const prefix = e.split("@")[0].toLowerCase();
                    const nameParts = author.name.toLowerCase().split(/\s+/);
                    return nameParts.some(p => prefix.includes(p));
                });
                if (matchingEmail) {
                    author.email = matchingEmail;
                }
            }
        }

        const remainingEmails = emails.filter(e =>
            !result.authors.some(a => a.email === e)
        );
        for (const author of result.authors) {
            if (!author.email && remainingEmails.length > 0) {
                author.email = remainingEmails.shift();
            }
        }
    }

    // --- Fallback: fill empty affiliationNums ---
    const emptyAuthors = result.authors.filter(a => !a.affiliationNums);
    if (emptyAuthors.length > 0 && result.affiliations.length > 0) {
        if (result.authors.length === result.affiliations.length) {
            result.authors.forEach((a, i) => {
                if (!a.affiliationNums) a.affiliationNums = String(result.affiliations[i].num);
            });
        } else {
            const firstNum = String(result.affiliations[0].num);
            result.authors.forEach(a => {
                if (!a.affiliationNums) a.affiliationNums = firstNum;
            });
        }
    }

    return result;
}

function parseText(text) {
    authorCounter = 0;
    affCounter = 0;
    const format = detectFormat(text);
    let result;
    if (format === "A") {
        result = parseFormatA(text);
    } else {
        result = parseFormatB(text);
    }
    result.format = format;
    return result;
}

// ===================== UI Rendering =====================

function createAuthorCard(author, isFirst) {
    const div = document.createElement("div");
    div.className = "author-card";
    div.dataset.id = author.id;

    const displayName = isFirst ? author.name : "";

    div.innerHTML = `
        <button class="remove-btn" onclick="removeAuthor(${author.id})" title="Remove">×</button>
        <div class="row">
            <div>
                <label>Name</label>
                <input type="text" class="name-input" value="${escapeHtml(displayName)}" data-field="name" placeholder="Author name" />
            </div>
            <div style="flex:1; min-width:120px;">
                <label>Affiliation # (机构编号)</label>
                <input type="text" style="width:100%;" value="${escapeHtml(author.affiliationNums)}" data-field="affiliationNums" placeholder="e.g. 1 or 1,2" />
            </div>
            <div class="checkbox-group">
                <input type="checkbox" ${author.isCorresponding ? "checked" : ""} data-field="isCorresponding" id="corr-${author.id}" />
                <label for="corr-${author.id}">是否确认是通讯作者</label>
            </div>
        </div>
        <div class="row">
            <div style="flex:1;">
                <label>Email</label>
                <input type="text" style="width:100%;" value="${escapeHtml(author.email)}" data-field="email" placeholder="email@example.com" />
            </div>
        </div>
        <div class="row">
            <div style="flex:1;">
                <label>Title (e.g. PhD, Associate Professor) — 可选</label>
                <input type="text" style="width:100%;" value="${escapeHtml(author.title || '')}" data-field="title" placeholder="Optional" />
            </div>
        </div>
    `;
    return div;
}

function createAffCard(aff) {
    const div = document.createElement("div");
    div.className = "aff-card";
    div.dataset.id = aff.id;

    div.innerHTML = `
        <button class="remove-btn" onclick="removeAff(${aff.id})" title="Remove">×</button>
        <div class="row">
            <div>
                <label>#</label>
                <input type="number" value="${aff.num}" data-field="num" style="width:60px;" min="1" />
            </div>
        </div>
        <label>三行机构格式: 学院系 → 主体学校 → 城市, 省份, 邮编, 国家</label>
        <textarea data-field="lines" placeholder="School / Department / College,
University Name,
City, State/Province, ZipCode, Country">${escapeHtml(aff.lines)}</textarea>
        <div style="margin-top:6px; font-size:11px; color:#888;">
            ⚠ 验证只针对第二行（主体学校名称）
        </div>
        <button type="button" class="btn btn-sm verify-school-btn" style="margin-top:4px;">🔍 Verify 验证机构</button>
    `;
    return div;
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderForm(data) {
    authorsContainer.innerHTML = "";
    affiliationsContainer.innerHTML = "";

    if (data.authors.length > 0) {
        data.authors.forEach((author, idx) => {
            authorsContainer.appendChild(createAuthorCard(author, idx === 0));
        });
    } else {
        authorsContainer.appendChild(createAuthorCard({
            id: ++authorCounter, name: "", isCorresponding: true, affiliationNums: "", email: "", title: ""
        }, true));
    }

    if (data.affiliations.length > 0) {
        for (const aff of data.affiliations) {
            affiliationsContainer.appendChild(createAffCard(aff));
        }
    } else {
        affiliationsContainer.appendChild(createAffCard({
            id: ++affCounter, num: 1, lines: ""
        }));
    }

    fundInput.value = data.fundInfo.join("\n");
}

// Initialize form with one empty author and one empty affiliation card
(function initForm() {
    authorsContainer.appendChild(createAuthorCard({
        id: ++authorCounter, name: "", isCorresponding: true, affiliationNums: "", email: "", title: ""
    }, true));
    affiliationsContainer.appendChild(createAffCard({
        id: ++affCounter, num: 1, lines: ""
    }));
})();

function removeAuthor(id) {
    const card = authorsContainer.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
}

function removeAff(id) {
    const card = affiliationsContainer.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
}

// ===================== Collect Form Data =====================

function collectFormData() {
    const authors = [];
    const authorCards = authorsContainer.querySelectorAll(".author-card");
    authorCards.forEach(card => {
        const name = card.querySelector('[data-field="name"]').value.trim();
        if (!name) return;
        authors.push({
            name: name,
            affiliationNums: card.querySelector('[data-field="affiliationNums"]').value.trim(),
            isCorresponding: card.querySelector('[data-field="isCorresponding"]').checked,
            email: card.querySelector('[data-field="email"]').value.trim(),
            title: card.querySelector('[data-field="title"]').value.trim(),
        });
    });

    const affiliations = [];
    const affCards = affiliationsContainer.querySelectorAll(".aff-card");
    affCards.forEach(card => {
        const num = parseInt(card.querySelector('[data-field="num"]').value);
        const lines = card.querySelector('[data-field="lines"]').value.trim();
        if (!lines) return;
        affiliations.push({
            num: num || affiliations.length + 1,
            lines: lines.split("\n").map(l => l.trim()).filter(l => l),
        });
    });

    // Re-number affiliations sequentially
    affiliations.forEach((aff, i) => { aff.num = i + 1; });

    return {
        title: titleInput.value.trim(),
        filename: filenameInput.value.trim(),
        authors: authors,
        affiliations: affiliations,
        fundInfo: fundInput.value.trim().split("\n").filter(l => l.trim()),
    };
}

// ===================== Event Handlers =====================

function doParse() {
    const text = rawInput.value.trim();
    if (!text) {
        parseStatus.textContent = "请先上传文件或粘贴信息";
        parseStatus.style.color = "#e74c3c";
        return;
    }

    const data = parseText(text);

    renderForm(data);

    if (data.authors.length === 0) {
        parseStatus.textContent = "⚠ 未能自动识别，请在右侧手动填写";
        parseStatus.style.color = "#f59e0b";
        return;
    }

    parseStatus.textContent = `✅ 识别为格式${data.format}，找到 ${data.authors.length} 位作者，${data.affiliations.length} 个机构 — 请核对修正`;
    parseStatus.style.color = "#27ae60";
}

parseBtn.addEventListener("click", doParse);

document.getElementById("add-author-btn").addEventListener("click", () => {
    const newAuthor = {
        id: ++authorCounter,
        name: "",
        isCorresponding: false,
        affiliationNums: "",
        email: "",
        title: ""
    };
    authorsContainer.appendChild(createAuthorCard(newAuthor, false));
});

document.getElementById("add-aff-btn").addEventListener("click", () => {
    const newAff = {
        id: ++affCounter,
        num: affiliationsContainer.children.length + 1,
        lines: ""
    };
    affiliationsContainer.appendChild(createAffCard(newAff));
});

generateBtn.addEventListener("click", async () => {
    const data = collectFormData();

    if (!data.title) {
        genStatus.textContent = "请输入英文题目 Title";
        genStatus.style.color = "#e74c3c";
        return;
    }

    if (data.authors.length === 0) {
        genStatus.textContent = "至少需要一位作者";
        genStatus.style.color = "#e74c3c";
        return;
    }

    // Convert affiliation numbers to arrays for backend
    data.authors = data.authors.map(a => ({
        ...a,
        affiliations: a.affiliationNums.split(/[,，\s]+/).map(n => parseInt(n)).filter(n => !isNaN(n)),
    }));

    genStatus.textContent = "生成中...";
    genStatus.style.color = "#888";

    try {
        const resp = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error || "生成失败");
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.filename || "title_page"}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        genStatus.textContent = "下载完成！";
        genStatus.style.color = "#27ae60";
    } catch (e) {
        genStatus.textContent = "错误: " + e.message;
        genStatus.style.color = "#e74c3c";
    }
});

// ===================== School Verification =====================

function extractSchoolName(line) {
    if (!line) return "";
    let s = line.trim();
    s = s.replace(/[,，.。;；:：]+$/, "");
    const parts = s.split(/[,，]/).map(p => p.trim()).filter(p => p);
    for (const part of parts) {
        if (/\b(?:University|College|Institute|Academy)\b/i.test(part)) {
            return part;
        }
    }
    if (parts.length > 1) {
        parts.sort((a, b) => b.length - a.length);
        return parts[0];
    }
    return s;
}

document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("verify-school-btn")) return;
    const card = e.target.closest(".aff-card");
    const textarea = card.querySelector('[data-field="lines"]');
    const lines = textarea.value.split("\n").map(l => l.trim()).filter(l => l);
    const rawLine = lines.length >= 2 ? lines[1] : lines[0];
    const schoolName = extractSchoolName(rawLine);
    if (!schoolName) return;

    try {
        const resp = await fetch("/api/verify-school", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: schoolName }),
        });
        const data = await resp.json();
        if (data.search_url) {
            window.open(data.search_url, "_blank");
        }
    } catch (err) {
        alert("搜索失败");
    }
});
