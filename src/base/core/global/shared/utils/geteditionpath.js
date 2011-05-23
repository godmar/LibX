
/**
 * Returns the URL to a given edition's directory.
 */
libx.utils.getEditionPath = function (editionId) {
    if (editionId[0] >= 'a' && editionId[0] <= 'z')
        return editionId;
    return editionId.substr(0, 2) + "/" + editionId.substr(2, 2) + "/" + editionId;
};
