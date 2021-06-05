export const distance = (x1, y1, x2, y2) => {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
};

export const midPoint = (x1, y1, x2, y2) => {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
};

export const pointToLineDist = (px, py, x1, y1, x2, y2) => {
    const vectorP = [px - x1, py - y1];
    const vectorL = [x2 - x1, y2 - y1];

    let unit_vectorP = [];
    let unit_vectorL = [];

    const line_length = distance(x1, x2, y1, y2);

    for (let i = 0; i < 2; i++) {
        unit_vectorP[i] = vectorP[i] / line_length;
        unit_vectorL[i] = vectorL[i] / line_length;
    }

    dot_product =
        unit_vectorP[0] * unit_vectorL[0] + unit_vectorP[1] * unit_vectorL[1];

    nearest_p = [x1 + vectorL[0] * dot_product, y1 + vectorL[1] * dot_product];

    return distance(px, py, nearest_p[0], nearest_p[1]);
};
