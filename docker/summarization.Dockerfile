FROM scratchbotcore/botrequirements:boilerplate

COPY ./summarization /summarization

EXPOSE 5000

WORKDIR /summarization