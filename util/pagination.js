const pagination = async (page, PAGE_SIZE) => {
  try {
    const skip = (page - 1) * PAGE_SIZE;
    return { skip, PAGE_SIZE };
  } catch (error) {
    throw new Error(error);
  }
};

export default pagination;
